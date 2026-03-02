import { authConfig } from "./auth-config";

const TOKEN_KEY = "jaljira_token";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

export async function apiFetch<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${authConfig.apiUrl}${path}`, {
        ...options,
        headers,
    });

    if (res.status === 401) {
        removeToken();
        window.location.href = "/auth";
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || "Request failed");
    }

    return res.json();
}

export async function exchangeCodeForToken(
    provider: "google" | "github",
    code: string
): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(
        `${authConfig.apiUrl}/api/auth/oauth2/${provider}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
        }
    );

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Authentication failed" }));
        throw new Error(error.error || "Authentication failed");
    }

    return res.json();
}

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export function logout(): void {
    removeToken();
    window.location.href = "/auth";
}
