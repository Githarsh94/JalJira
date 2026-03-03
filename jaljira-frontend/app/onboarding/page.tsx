"use client"

export default function Onboarding() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">Welcome to Jaljira!</h1>
                <p className="text-muted-foreground">
                    It looks like this is your first time here. Let's get you set up!
                </p>
                <a
                    href="/dashboard"
                    className="inline-block px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition"
                >
                    Get Started
                </a>
            </div>
        </div>
    );
}