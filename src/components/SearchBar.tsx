"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import type { BanResult } from "@/lib/types";

interface SearchBarProps {
    onSelect: (result: BanResult) => void;
    isLoading?: boolean;
}

export default function SearchBar({ onSelect, isLoading = false }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<BanResult[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const selectedRef = useRef<string>("");

    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.length < 3 || q === selectedRef.current) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        setIsFetching(true);
        try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`);
            const json = await res.json();
            if (json.success && json.data) {
                setSuggestions(json.data);
                setIsOpen(true);
                setActiveIndex(-1);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(query), 280);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, fetchSuggestions]);

    const handleSelect = (result: BanResult) => {
        selectedRef.current = result.label;
        setQuery(result.label);
        setSuggestions([]);
        setIsOpen(false);
        setActiveIndex(-1);
        onSelect(result);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, -1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0) {
                handleSelect(suggestions[activeIndex]);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };

    const handleBlur = () => {
        // Delay to allow click on suggestion
        setTimeout(() => {
            setIsOpen(false);
            setActiveIndex(-1);
        }, 150);
    };

    const showSpinner = isFetching || isLoading;

    return (
        <div className="relative w-full max-w-2xl mx-auto" role="combobox" aria-expanded={isOpen} aria-haspopup="listbox">
            <div
                className={`
                    flex items-center gap-3 rounded-2xl px-5 py-4
                    bg-card border-2 border-border
                    transition-all duration-200 shadow-sm
                    focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_4px_oklch(0.35_0.12_260_/_10%)]
                `}
            >
                {showSpinner ? (
                    <Loader2 className="h-6 w-6 text-[var(--primary)] shrink-0 animate-spin" />
                ) : (
                    <Search className="h-6 w-6 text-[var(--muted-foreground)] shrink-0" />
                )}
                <input
                    ref={inputRef}
                    id="address-search"
                    type="search"
                    autoComplete="off"
                    spellCheck={false}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    placeholder="Saisissez l'adresse du bien cible..."
                    className="flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] text-lg font-medium outline-none"
                    aria-label="Rechercher une adresse"
                    aria-autocomplete="list"
                    aria-controls="suggestion-list"
                    aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
                    disabled={isLoading}
                />
                {query.length > 0 && !isLoading && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setSuggestions([]);
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                        className="p-1.5 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0"
                        aria-label="Effacer la recherche"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <ul
                    ref={listRef}
                    id="suggestion-list"
                    role="listbox"
                    className="absolute z-50 top-full mt-2 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-fade-in-up"
                >
                    {suggestions.map((s, i) => (
                        <li
                            key={s.id}
                            id={`suggestion-${i}`}
                            role="option"
                            aria-selected={i === activeIndex}
                            onMouseDown={() => handleSelect(s)}
                            className={`
                                flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors
                                ${i === activeIndex
                                    ? "bg-primary/5"
                                    : "hover:bg-[var(--muted)]/50"
                                }
                                ${i > 0 ? "border-t border-[var(--border)]" : ""}
                            `}
                        >
                            <MapPin className="h-5 w-5 mt-0.5 text-[var(--primary)] shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-base font-semibold text-[var(--foreground)]">
                                    {s.label}
                                </span>
                                <span className="text-sm font-medium text-[var(--muted-foreground)] mt-0.5">
                                    {s.context}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
