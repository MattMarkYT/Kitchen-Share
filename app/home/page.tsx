'use client';
import styles from "./homepage.module.css";
import pb from "@/app/lib/pb";
import React, { useEffect, useState } from "react";
import { ListingCard } from "../components/ListingCard";
import { useCurrentUser, useListings } from "@/app/hooks";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import LocationPicker from "@/app/components/LocationPicker";
import type { pbuser } from "@/app/types/pbuser";
import { CATEGORY_OPTIONS } from "@/app/types/categories";

export default function Home() {
    const currentUserId = useCurrentUser();
    const isMobile = useIsMobile(); 
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [userLoading, setUserLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // load the logged-in user's city/state as default location
    useEffect(() => {
        let cancelled = false;

        async function loadUserLocation() {
            if (currentUserId) {
                try {
                    const user = await pb.collection("users").getOne<pbuser>(currentUserId);
                    if (!cancelled && user.city && user.state) {
                        setCity(user.city);
                        setState(user.state);
                    }
                } catch {
                    // user not found or error — leave location empty for now
                }
            }
            if (!cancelled) setUserLoading(false);
        }

        loadUserLocation();
        return () => { cancelled = true; };
    }, [currentUserId]);

    const { listings, loading, error } = useListings({ city, state, enabled: !userLoading, excludeSeller: currentUserId, category: selectedCategory });

    function handleLocationChange(newCity: string, newState: string) {
        setCity(newCity);
        setState(newState);
    }

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-stone-500">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
                {/* header row with title + location picker */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
                        {city ? `Food in ${city}` : "Food Near You"}
                    </h1>
                    <LocationPicker
                        city={city}
                        state={state}
                        onLocationChange={handleLocationChange}
                    />
                </div>

                {/* category filter bar */}
                <div className="mb-8 flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                            selectedCategory === null
                                ? "bg-stone-900 text-white"
                                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                    >
                        All
                    </button>
                    {CATEGORY_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => setSelectedCategory(selectedCategory === value ? null : value)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                selectedCategory === value
                                    ? "bg-stone-900 text-white"
                                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* error state */}
                {error && (
                    <p className="mb-6 text-sm text-red-500">
                        Failed to load listings. Please try again.
                    </p>
                )}

                {/* loading state */}
                {loading && (
                    <p className="text-stone-500">Loading listings...</p>
                )}

                {/* empty state */}
                {!loading && !error && listings.length === 0 && (
                    <div className="mt-16 text-center">
                        <p className="text-lg text-stone-500">
                            No listings found{city ? ` in ${city}, ${state}` : ""}. Try a different location!
                        </p>
                    </div>
                )}

                {/* listings grid */}
                {!loading && listings.length > 0 && (
                    <div className={styles.flexContainer}>
                        <ul className={styles.gridLayout}>
                            {listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </main>
    );
}