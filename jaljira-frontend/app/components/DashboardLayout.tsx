"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Loader2,
    Zap,
} from "lucide-react";
import { logout, apiFetch, type AuthUser } from "../lib/api";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await apiFetch<AuthUser>("/api/user/info");
                setUser(userData);
                // Store org_id and user info for use across pages
                const orgId =
                    (userData as any).organization_id ??
                    (("organization" in userData && userData.organization)
                        ? (userData.organization as any).id
                        : null);

                if (orgId != null) {
                    localStorage.setItem("org_id", String(orgId));
                }
            } catch (err) {
                console.error("Failed to fetch user:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const navigationItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            visible: true,
        },
        {
            name: "Teams",
            href: "/dashboard/teams",
            icon: Users,
            visible: true,
        },
        {
            name: "Epics",
            href: "/dashboard/epics",
            icon: Zap,
            visible: true,
        },
    ];

    const activeItem = navigationItems.find((item) => item.href === pathname);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside
                className={`${
                    sidebarOpen ? "w-64" : "w-20"
                } bg-card border-r border-border transition-all duration-300 flex flex-col`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                                ⚡
                            </div>
                            <span className="font-bold text-foreground">Jaljira</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-2">
                    {navigationItems
                        .filter((item) => item.visible)
                        .map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <button
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                                    </button>
                                </Link>
                            );
                        })}
                </nav>

                {/* User Profile */}
                {user && (
                    <div className="p-3 border-t border-border space-y-3">
                        <div
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                                sidebarOpen ? "bg-muted" : ""
                            }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                            </div>
                            {sidebarOpen && (
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">
                                        {user.firstName || user.email.split("@")[0]}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={logout}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm ${
                                !sidebarOpen ? "justify-center" : ""
                            }`}
                        >
                            <LogOut className="w-4 h-4 flex-shrink-0" />
                            {sidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-semibold text-foreground capitalize">
                            {activeItem?.name || "Dashboard"}
                        </h1>
                        {user && (
                            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                                {user.email}
                            </span>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
