'use client';

import { ListingCard } from "@/app/components/ListingCard";
import { useFavorites } from "@/app/hooks/useFavorites";
import pb from "@/app/lib/pb";

export default function Favorites() {
    const user = pb.authStore.model;
    const userId = user?.id || null;

    const { favorites, loading } = useFavorites(userId);

    if (loading) {
        return (
            <main className="min-h-screen bg-white font-sans relative overflow-hidden">
                <div className="p-6">
                    <h1 className="mb-8 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl text-center">
                        Your Favorites
                    </h1>
                    <p className="text-lg text-gray-500 text-center mt-10">
                        Loading...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className="p-6">
                {/* Title */}
                <h1 className="mb-8 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl text-center">
                    Your Favorites
                </h1>

                {/* Empty state */}
                {favorites.length === 0 ? (
                    <p className="text-lg text-gray-500 text-center mt-10">
                        You have no favorite meals yet.
                    </p>
                ) : (
                    <div className="flex justify-center mt-16 mb-24 mx-6">
                        <ul className="grid gap-10 grid-cols-[repeat(auto-fill,minmax(177px,1fr))] max-w-[1200px] w-full list-none p-0">
                            {favorites.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </main>
    );
}