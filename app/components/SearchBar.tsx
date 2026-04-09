"use client";

import Form from "next/form";
import { useEffect, useMemo, useRef, useState } from "react";
import throttle from "lodash.throttle";
import pb from "@/app/lib/pb";
import { Listing } from "@/app/home/page";
import { Result } from "@/app/search/page";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [liveInput, setLiveInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const throttledSetQuery = useMemo(
        () => throttle((q: string) => setQuery(q), 400),
        []
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLiveInput(value);
        throttledSetQuery(value);
    };

    const selectSuggestion = (item: string) => {
        setLiveInput(item);
        setQuery(item);
        setSuggestions([]);
        router.push(`/search?query=${encodeURIComponent(item)}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (query.split(" ").filter(Boolean).length === 0) {
                setSuggestions([]);
                return;
            }

            let filterStr = "";
            const params: Record<string, string> = {};
            const queryWords = query.split(" ").filter(Boolean);

            queryWords.forEach((word, i) => {
                const key = `search${i}`;
                filterStr += `title ~ {:${key}}`;
                if (i < queryWords.length - 1) filterStr += " || ";
                params[key] = word;
            });

            const dataBeforeFilter = await pb.collection("listings").getList<Listing>(1, 15, {
                filter: pb.filter(filterStr, params),
            });

            const filterResults: Result[] = [];
            for (const listing of dataBeforeFilter.items) {
                let matches = 0;
                for (const word of query.split(" ")) {
                    if (listing.title.toLowerCase().includes(word.toLowerCase())) {
                        matches++;
                    }
                }
                if (matches > 0) {
                    filterResults.push({ matches, listing });
                }
            }

            filterResults.sort((a, b) => a.matches - b.matches);

            const suggestionsSet: Set<string> = new Set();
            while (filterResults.length > 0) {
                const r = filterResults.pop();
                if (r) suggestionsSet.add(r.listing.title);
            }

            setSuggestions(Array.from(suggestionsSet));
        };

        fetchData();
    }, [query]);

    return (
        <div className="relative w-full max-w-xl">
            <Form action="/search" className="w-full">
                <div
                    className={`flex items-center rounded-full border bg-white/95 px-4 py-2 shadow-sm transition-all duration-200 ${
                        isFocused
                            ? "border-amber-500 ring-4 ring-amber-100 shadow-md"
                            : "border-stone-200 hover:border-stone-300"
                    }`}
                >
                    <Search className="mr-3 h-4 w-4 text-stone-400" />

                    <input
                        ref={inputRef}
                        name="query"
                        type="text"
                        value={liveInput}
                        placeholder="Search restaurants, dishes, or neighborhoods"
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="w-full bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none md:text-[15px]"
                    />
                </div>
            </Form>

            {isFocused && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                    {suggestions.map((item, idx) => (
                        <li
                            key={idx}
                            onMouseDown={() => selectSuggestion(item)}
                            className="cursor-pointer border-b border-stone-100 px-4 py-3 text-sm text-stone-700 transition-colors last:border-b-0 hover:bg-stone-50 hover:text-stone-900"
                        >
                            <div className="flex items-center gap-3">
                                <Search className="h-4 w-4 text-stone-300" />
                                <span>{item}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}