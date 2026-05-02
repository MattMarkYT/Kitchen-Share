'use client';
import pb from "@/app/lib/pb";
import React, { useEffect, useState } from "react";
import { ListingCard } from "../components/NewListingCard";
import { useCurrentUser, useListings } from "@/app/hooks";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import LocationPicker from "@/app/components/LocationPicker";
import type { pbuser } from "@/app/types/pbuser";
import { CATEGORY_OPTIONS } from "@/app/types/categories";
import {useFavorites} from "@/app/hooks/useFavorites";
import {ChevronRight, SlidersHorizontal} from "lucide-react";
import Image from "next/image";
import homeBanner from "@/public/homebanner.webp"

export default function Home() {
    const currentUserId = useCurrentUser();
    const isMobile = useIsMobile(); 
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [userLoading, setUserLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { favorites, favoriteIds, refetch } = useFavorites(currentUserId);

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
        <main className="min-h-screen bg-stone-50 text-stone-900 mb-25">
            <div className="mx-auto px-4 py-10 sm:px-14 md:px-16 lg:px-20 xl:px-30">
                <section className="p-6 sm:p-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="relative">
                                <div className={"relative z-10"}>
                                    <p className="text-[2rem] font-extrabold leading-none tracking-[-0.03em] text-stone-900 sm:text-[2.75rem]">
                                        Good food is
                                        <br />
                                        <span className="text-orange-500">closer than you think.</span>
                                    </p>
                                    <p className="mt-3 text-sm text-stone-500 sm:text-base">
                                        Real food. Real people. Real community.
                                    </p>
                                </div>

                                <Image src={homeBanner} alt={""} className={"translate-0 lg:translate-x-1/1 pointer-events-none absolute right-0 lg:-right-20 top-1/2 h-auto w-[320px] -translate-y-1/2 opacity-25 lg:opacity-40 sm:w-[420px] lg:w-[520px]"}/>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <LocationPicker
                                    city={city}
                                    state={state}
                                    onLocationChange={handleLocationChange}
                                />
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filters
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 overflow-x-auto pb-1">
                            {CATEGORY_OPTIONS.map(({value, label}) => {
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSelectedCategory(selectedCategory === value ? null : value)}
                                        className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                                            selectedCategory === value
                                                ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                                                : 'border-stone-100 bg-white text-stone-700 hover:border-stone-300'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                Failed to load listings. Please try again.
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-[300px] animate-pulse rounded-[24px] border border-stone-200 bg-white"
                                    />
                                ))}
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-stone-300 bg-white/70 px-6 text-center">
                                <p className="max-w-md text-sm text-stone-500 sm:text-base">
                                    No listings found{city ? ` in ${city}${state ? `, ${state}` : ''}` : ''}. Try another location or category.
                                </p>
                            </div>
                        ) : (
                            <div className={"flex flex-col items-center justify-center"}>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-sm sm:max-w-full mb-10">
                                    {listings.map((listing) => (
                                        <ListingCard key={listing.id} listing={listing} />
                                    ))}
                                </div>

                                <div className="flex justify-center pt-2">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
                                    >
                                        Load more
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}