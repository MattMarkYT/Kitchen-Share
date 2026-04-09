"use client";

import React, { useState, useEffect } from "react";
import pb from "../lib/pb";
import Link from "next/link";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Listing } from "@/app/home/page";

export type Result = {
    matches: number;
    listing: Listing;
};

function ListingCard({ listing }: { listing: Listing }) {
    const imgUrl =
        pb.files.getURL(listing, listing.main_image as string, { thumb: "640x480" }) ||
        "/placeholder.jpg";

    return (
        <li className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link href={`/listing/${listing.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                        src={imgUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                </div>

                <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="line-clamp-1 text-lg font-semibold text-stone-900">
                                {listing.title || "Unknown"}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                                <MapPin className="h-4 w-4" />
                                <span className="line-clamp-1">
                                    {listing.location || "Neighborhood unavailable"}
                                </span>
                            </div>
                        </div>

                        <div className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                            ${listing.price.toLocaleString()}
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
}

export default function SearchPage({
                                       searchParams,
                                   }: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    let { query } = React.use(searchParams);
    query = query == undefined || query.trim() === "" ? " " : query;

    const [listings, setListings] = useState<Listing[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const queryWords = query.split(" ").filter(Boolean);

                let data: Listing[] = [];

                if (queryWords.length === 0) {
                    const allListings = await pb.collection("listings").getList<Listing>(1, 15, {
                        sort: "-created",
                    });
                    data = allListings.items;
                } else {
                    let filterStr = "";
                    const params: Record<string, string> = {};

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
                        for (const word of queryWords) {
                            if (listing.title.toLowerCase().includes(word.toLowerCase())) {
                                matches++;
                            }
                        }
                        if (matches > 0) {
                            filterResults.push({ matches, listing });
                        }
                    }

                    filterResults.sort((a, b) => a.matches - b.matches);

                    while (filterResults.length > 0) {
                        const r = filterResults.pop();
                        if (r) data.push(r.listing);
                    }
                }

                if (!cancelled) setListings(data);
            } catch (err) {
                if (!cancelled) setError(err as Error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [query]);

    if (loading) {
        return (
            <main className="min-h-screen bg-stone-50">
                <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6">
                    <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-stone-600 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Finding great local spots...</span>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-stone-50 px-6 py-16">
                <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <h2 className="text-2xl font-semibold text-stone-900">
                        Something went wrong
                    </h2>
                    <p className="mt-3 text-sm text-stone-600">
                        We couldn&apos;t load the search results right now.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-stone-50">
            <section className="border-b border-stone-200 bg-gradient-to-b from-amber-50/70 to-stone-50">
                <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
                    <div className="max-w-3xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-700 shadow-sm">
                            <Search className="h-3.5 w-3.5" />
                            Explore local food
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-5xl">
                            {query === " " ? "Discover neighborhood favorites" : `Results for “${query}”`}
                        </h1>

                        <p className="mt-4 text-base leading-7 text-stone-600 md:text-lg">
                            {query === " "
                                ? "Browse the latest listings from local restaurants, pop-ups, and neighborhood food spots."
                                : `${listings?.length ?? 0} result${listings?.length === 1 ? "" : "s"} matching your search.`}
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-12">
                {listings && listings.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </ul>
                ) : (
                    <div className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white px-8 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                            <Search className="h-6 w-6" />
                        </div>

                        <h2 className="mt-6 text-2xl font-semibold text-stone-900">
                            No results found
                        </h2>
                        <p className="mt-3 text-stone-600">
                            We couldn&apos;t find anything for <span className="font-medium text-stone-900">“{query}”</span>.
                            Try a restaurant name, dish, or neighborhood instead.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}