"use client";

import React, { useState, useEffect } from "react";
import pb from "../lib/pb";
import Link from "next/link";
import { Search, Loader2, MapPinSearch, UserRoundSearch } from "lucide-react";
import { Listing } from "@/app/types/listing";
import {ListingCard} from "@/app/components/ListingCard";
import {useSearch} from "@/app/hooks/useSearch";
import {pbuser} from "@/app/types/pbuser";
import {sortListings} from "@/app/api/search";
import {UserCard} from "@/app/components/UserCard";

export type Result = {
    matches: number;
    listing: Listing;
};

export default function SearchPage({
                                       searchParams,
                                   }: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    let { query } = React.use(searchParams);
    query = query == undefined ? " " : query;

    const [type, setType] = useState<'food' | 'user' | 'neighborhood'>('food');

    const [listingSuggestions, setListingSuggestions] = useState<Listing[]>([]);
    const [userSuggestions, setUserSuggestions] = useState<pbuser[]>([]);
    const [neighborhoodSuggestions, setNeighborhoodSuggestions] = useState<Listing[]>([]);

    const {listings, users, neighborhoods, loading, error} = useSearch(type === "food" ? query : query.slice(1), 1, type == 'food', type == 'user', type != 'user');

    useEffect(() => {

        const fetchData = async () => {
            setType(
                query.startsWith("@") ? "user" :
                    query.startsWith("!") ? "neighborhood" :
                        "food"
            );

            if (type == 'food'){
                if (!listings.length) { setListingSuggestions(neighborhoods); }
                else {
                    // Sort food by relevancy
                    const filteredListings = sortListings(query, listings);

                    setListingSuggestions(filteredListings);
                }
            }
            else if (type == 'user') setUserSuggestions(users);
            else if (type == 'neighborhood') setNeighborhoodSuggestions(neighborhoods);

        };

        fetchData();

    }, [type, query, listings, users, neighborhoods]);

    if (loading) {
        return (
            <main className="min-h-screen bg-stone-50">
                <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6">
                    <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-5 py-3 text-stone-600 shadow-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Finding great local spots...
                            {type == 'food' ?
                                    "Finding great local spots..."
                                : type == 'user' ?
                                    "Finding neighbors..."
                                : type == 'neighborhood' ?
                                    "Finding neighborhoods..."
                            : null}
                        </span>
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
                        {"We couldn't load the search results right now."}
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
                            { type == 'food' ? <Search className="h-3.5 w-3.5" /> : type == 'user' ?
                                <UserRoundSearch className="h-3.5 w-3.5" />
                                : <MapPinSearch className="h-3.5 w-3.5" /> }
                            { type == 'user' ?
                                "Find neighbors"
                                :
                                "Explore local food"
                            }
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-5xl">
                            {query.trim() === "" ? "Discover neighborhood favorites"
                                : query === "@" ? "Meet new neighbors"
                                : `Results for “${query.slice(type != 'food' ? 1 : 0)}”`}
                        </h1>

                        <p className="mt-4 text-base leading-7 text-stone-600 md:text-lg">
                            {type === "food"
                                ?
                                (query === " " ? "Browse the latest listings from local restaurants, pop-ups, and neighborhood food spots."
                                        : `${listingSuggestions?.length ?? 0} result${listingSuggestions?.length === 1 ? "" : "s"}`)
                            : type === "user" ?
                                    `${userSuggestions?.length ?? 0} result${userSuggestions?.length === 1 ? "" : "s"}`
                                    : type === "neighborhood" ?
                                        `${neighborhoodSuggestions?.length ?? 0} result${neighborhoodSuggestions?.length === 1 ? "" : "s"}`
                            : null} matching your search.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-12">
                {type === 'food' && (listingSuggestions.length > 0 || neighborhoodSuggestions.length > 0) ? (
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {listingSuggestions.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </ul>
                ) :
                    type === 'user' && userSuggestions && userSuggestions.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {userSuggestions.map((user) => (
                                <UserCard key={user.id} user={user} />
                            ))}
                        </ul>
                    ) :
                        type === 'neighborhood' && neighborhoodSuggestions && neighborhoodSuggestions.length > 0 ? (
                                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {neighborhoodSuggestions.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} />
                                    ))}
                                </ul>
                            )
                    : (
                    <div className="mx-auto max-w-2xl rounded-3xl border border-stone-200 bg-white px-8 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                            <Search className="h-6 w-6" />
                        </div>

                        <h2 className="mt-6 text-2xl font-semibold text-stone-900">
                            No results found
                        </h2>
                        <p className="mt-3 text-stone-600">
                            {"We couldn't find anything for "}<span className="font-medium text-stone-900">“{query}”</span>.
                        </p>
                        <p className="mt-3 text-stone-600">
                            Try another dish, neighbor, or city name.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}