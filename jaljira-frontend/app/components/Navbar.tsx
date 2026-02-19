"use client";

import { Zap } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-[15px]">Jaljira</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "Blog", "Docs"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth">
            <button className="inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-sm px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              Sign in
            </button>
          </Link>
          <Link href="/auth">
            <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              Get started
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
