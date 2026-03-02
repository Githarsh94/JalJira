"use client";

import { useEffect, useState } from "react";
import { apiFetch, isAuthenticated, logout, type AuthUser } from "../lib/api";
import { LogOut, Loader2 } from "lucide-react";

export default function DashboardPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            window.location.href = "/auth";
            return;
        }

        apiFetch<AuthUser>("/api/user/info")
            .then(setUser)
            .catch(() => {
                window.location.href = "/auth";
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-muted/30">
            <header className="bg-background border-b border-border">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-foreground">Jaljira Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            {user.role}
                        </span>
                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12">
                <div className="max-w-lg bg-card border border-border rounded-xl p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-foreground mb-6">Your Profile</h2>
                    <dl className="space-y-4">
                        {[
                            ["Name", `${user.firstName} ${user.lastName}`.trim() || "—"],
                            ["Email", user.email],
                            ["Role", user.role],
                            ["User ID", user.id],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                                <dd className="text-sm text-foreground">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </main>
        </div>
    );
}
