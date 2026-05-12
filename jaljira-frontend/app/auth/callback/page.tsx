"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { exchangeCodeForToken, setToken, apiFetch } from "../../lib/api";
import { Loader2 } from "lucide-react";

const USER_DATA_KEY = "jaljira_user";

export function setUserData(user: any): void {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

export default function AuthCallback() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get("code");
        // Check both URL param (if redirected directly) and localStorage (if via /auth page)
        const isManagerInviteParam = searchParams.get("manager_invite") === "true";
        const isManagerInviteStorage = localStorage.getItem("manager_invite") === "true";
        const isManagerInvite = isManagerInviteParam || isManagerInviteStorage;

        // Determine provider from state param or localStorage
        const provider = (localStorage.getItem("oauth_provider") || "google") as "google" | "github";

        if (!code) {
            setError("No authorization code received");
            return;
        }

        console.log("Auth callback started - isManagerInvite:", isManagerInvite);

        exchangeCodeForToken(provider, code)
            .then(async ({ token, user }) => {
                setToken(token);
                console.log("Auth callback - isManagerInvite:", isManagerInvite);

                // If this is a manager invite, mark user as onboarded
                if (isManagerInvite) {
                    try {
                        console.log("Calling /api/user/mark-onboarded...");
                        const response = await apiFetch("/api/user/mark-onboarded", {
                            method: "POST"
                        });
                        console.log("Mark onboarded response:", response);
                        user.isOnboarded = true;
                        console.log("User marked as onboarded in memory");
                    } catch (err) {
                        console.error("FAILED to mark user as onboarded:", err);
                        // Continue anyway, user can manually complete onboarding
                    }
                }

                console.log("Saving user data with isOnboarded:", user.isOnboarded);
                setUserData(user);
                localStorage.removeItem("oauth_provider");
                localStorage.removeItem("manager_invite");  // Clean up manager invite flag

                // Check if user is onboarded
                if (!user.isOnboarded) {
                    console.log("Redirecting to onboarding (not onboarded)");
                    window.location.href = "/auth/onboarding";
                } else {
                    console.log("Redirecting to dashboard (onboarded)");
                    window.location.href = "/dashboard";
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
