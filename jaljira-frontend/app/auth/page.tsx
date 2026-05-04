"use client";

import { Github, Droplet } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import teamCollaboration from "../assets/team-collaboration.png";
import { authConfig } from "../lib/auth-config";

function startOAuth(provider: "google" | "github") {
  localStorage.setItem("oauth_provider", provider);
  window.location.href = authConfig[provider].authUrl;
}

export default function AuthPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve manager_invite parameter if present
    const managerInvite = searchParams.get("manager_invite");
    if (managerInvite === "true") {
      console.log("Manager invite detected, storing in localStorage");
      localStorage.setItem("manager_invite", "true");
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Droplet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-lg">Jaljira</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-lg border border-border p-8">

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to Jaljira</h1>
            <p className="text-sm text-muted-foreground">
              Choose a provider to get started.
            </p>
          </div>

          {/* Social Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => startOAuth("google")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button
              onClick={() => startOAuth("github")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Github className="w-4 h-4" />
              Continue with GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Team Collaboration Image */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg">
          <Image
            src={teamCollaboration}
            alt="Team collaboration"
            className="w-full h-64 object-cover opacity-70"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="container mx-auto px-6">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">
            © 2026 JALJIRA MANAGEMENT PLATFORM. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
