import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jaljira - Streamline Your Agile Workflow",
  description: "Empower your product teams with role-based management, seamless Kanban integration, and real-time collaboration—all in one place with Jaljira.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
