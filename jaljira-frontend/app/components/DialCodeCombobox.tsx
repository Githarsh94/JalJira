"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { allCountries } = require("country-telephone-data") as {
    allCountries: { name: string; iso2: string; dialCode: string }[];
};

export function DialCodeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const filtered = query
        ? allCountries.filter(
            (c) =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.dialCode.includes(query.replace("+", ""))
        ).slice(0, 50)
        : allCountries.slice(0, 50);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative w-36">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
                <span>{value}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-64 rounded-md border border-border bg-card shadow-lg">
                    <div className="p-2 border-b border-border">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search country or code…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-3 py-1.5 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <ul className="max-h-52 overflow-y-auto">
                        {filtered.map((c) => (
                            <li
                                key={c.iso2}
                                onClick={() => { onChange(`+${c.dialCode}`); setOpen(false); setQuery(""); }}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent flex justify-between"
                            >
                                <span className="truncate">{c.name}</span>
                                <span className="text-muted-foreground ml-2">+{c.dialCode}</span>
                            </li>
                        ))}
                        {filtered.length === 0 && (
                            <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
