"use client";

import { useEffect, useState } from "react";
import { apiFetch, isAuthenticated, type AuthUser } from "../lib/api";
import { Loader2, Zap, Users, Target } from "lucide-react";

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
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Welcome back, {user.firstName || user.email.split("@")[0]}
                    </h1>
                    <p className="text-muted-foreground">
                        {user.role === "ADMIN"
                            ? "Manage your organization, teams, and members"
                            : "Your sprint velocity is amazing this week. Keep the momentum."}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Your Role</h3>
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{user.role}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {user.role === "ADMIN" ? "Full access to organization" : `Member since onboarding`}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Onboarding Status</h3>
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                            {user.isOnboarded ? "Complete" : "Pending"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            {user.isOnboarded ? "Account is fully set up" : "Complete your profile"}
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-lg font-bold text-foreground truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-2">Primary contact</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="max-w-2xl">
                    <div className="bg-card border border-border rounded-lg p-8">
                        <h2 className="text-xl font-bold text-foreground mb-6">Your Profile</h2>
                        <dl className="space-y-4">
                            {[
                                ["Full Name", `${user.firstName} ${user.lastName}`.trim() || "—"],
                                ["Email", user.email],
                                ["Role", user.role],
                                ["User ID", user.id],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between items-center py-3 border-b border-border last:border-0"
                                >
                                    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
                                    <dd className="text-sm text-foreground font-medium">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {/* Next Steps */}
                {user.role === "ADMIN" && (
                    <div className="mt-12 bg-primary/10 border border-primary/30 rounded-lg p-6">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Next Steps for Admin
                        </h3>
                        <ul className="space-y-2 text-sm text-foreground/80">
                            <li>✓ Go to <strong>Teams</strong> to create your first team</li>
                            <li>✓ Assign managers to teams and invite them</li>
                            <li>✓ Managers can then invite team members</li>
                            <li>✓ Start creating sprints and managing tasks</li>
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}
