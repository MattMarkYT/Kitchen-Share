'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import pb from '@/app/lib/pb';
import { useMyListings } from '@/app/hooks/useMyListings';
import type { Listing } from '@/app/types/listing';

function getImageUrl(listing: Listing): string {
    if (!listing.main_image) return '/placeholder.jpg';
    return pb.files.getURL(listing, listing.main_image, { thumb: '640x480' });
}

function handleEditListing(listing: Listing) {
    // TODO: implement edit
}

export default function MyListingsPage() {
    const router = useRouter();
    const { listings, loading, error } = useMyListings();

    useEffect(() => {
        if (!pb.authStore.isValid) {
            router.replace('/auth');
        }
    }, [router]);

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-stone-900">My Listings</h1>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mb-10">
                <div>
                    <p className="text-2xl font-bold text-stone-900">{listings.length}</p>
                    <p className="text-sm text-stone-400">Posts</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-stone-900">—</p>
                    <p className="text-sm text-stone-400">Views</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-stone-900">—</p>
                    <p className="text-sm text-stone-400">Sold</p>
                </div>
            </div>

            {/* States */}
            {loading && (
                <div className="text-center py-16 text-stone-400 text-sm">Loading your listings...</div>
            )}
            {error && (
                <div className="text-center py-16 text-red-500 text-sm">Failed to load listings.</div>
            )}
            {!loading && !error && listings.length === 0 && (
                <div className="text-center py-16 text-stone-400 text-sm">You haven't posted any listings yet.</div>
            )}

            {/* Grid */}
            {!loading && !error && listings.length > 0 && (
                <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                    {listings.map((listing) => (
                        <li key={listing.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                            <Link href={`/listing/${listing.id}`} className="block">
                                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                                    <img
                                        src={getImageUrl(listing)}
                                        alt={listing.title}
                                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                    <div className="absolute bottom-3 right-3 rounded-full bg-white/60 px-3 py-1 text-sm font-semibold text-stone-900 shadow-sm backdrop-blur-sm">
                                        ${Number(listing.price).toLocaleString()}
                                    </div>
                                </div>

                                <div className="p-4 space-y-1">
                                    <h3 className="line-clamp-1 text-base font-semibold text-stone-900">
                                        {listing.title || 'Unknown'}
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-stone-500">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="line-clamp-1">{listing.location || 'Neighborhood unavailable'}</span>
                                    </div>
                                    <p className="text-xs text-stone-400">— views · — conversations</p>
                                </div>
                            </Link>

                            {/* Edit button outside Link so it doesn't navigate */}
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => handleEditListing(listing)}
                                    className="w-full py-1.5 text-sm font-semibold text-stone-900 border-2 border-stone-900 rounded-full hover:bg-stone-900 hover:text-white transition-colors duration-150"
                                >
                                    Edit
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
