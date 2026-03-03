"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { exchangeCodeForToken, setToken } from "../../lib/api";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        // Determine provider from state param or localStorage
        const provider = (localStorage.getItem("oauth_provider") || "google") as "google" | "github";

        if (!code) {
            setError("No authorization code received");
            return;
        }

        exchangeCodeForToken(provider, code)
            .then((data) => {
                console.log("Token exchange result:", data);
                localStorage.removeItem("oauth_provider");
                if (data.registered && data.token) {
                    setToken(data.token);
                    window.location.href = "/dashboard";
                } else {
                    if (data.email) localStorage.setItem("onboarding_email", data.email);
                    window.location.href = "/onboarding";
                }
            })
            .catch((err) => {
                setError(err.message);
            });
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-destructive font-medium">Authentication failed</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <a href="/auth" className="text-primary hover:underline text-sm">
                        Try again
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
        </div>
    );
}
