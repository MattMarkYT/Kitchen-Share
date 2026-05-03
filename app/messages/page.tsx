'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser, useConversations } from '../hooks';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/NewListingCard';
import { useLocation } from '../providers/LocationProvider';
import Link from 'next/link';

// Auto-redirect if conversations exist
function AutoSelectOrEmpty() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') as 'inbox' | 'dm' | 'archived' | null;
    const currentUserId = useCurrentUser();
    const { conversations, loading } = useConversations(currentUserId);
    const { city, state, locationReady } = useLocation();

    const { listings } = useListings({
        city,
        state,
        enabled: locationReady && tab !== 'dm',
        excludeSeller: currentUserId,
    });

    const previewListings = listings.slice(0, 4);

    // Redirect to most recent offer only when on the default/inbox tab
    const mostRecentOffer = tab === 'dm' ? null : conversations.find(
        c => !!c.listing && ((c.buyer === currentUserId && !c.buyer_archived) || (c.buyer !== currentUserId && !c.seller_archived))
    );

    useEffect(() => {
        if (loading || !mostRecentOffer) return;
        router.replace(`/messages/${mostRecentOffer.id}`);
    }, [mostRecentOffer, loading, router]);

    // Still loading conversations — show nothing yet
    if (loading) return <div className="flex-1 bg-gray-50" />;

    // Has a redirect target — blank while navigating
    if (mostRecentOffer) return <div className="flex-1 bg-gray-50" />;

    const hasLocation = !!(city && state);

    // ── DM empty state ──
    if (tab === 'dm') {
        return (
            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div
                    className="flex flex-col items-center justify-center min-h-full px-16 py-24 animate-[fadeIn_250ms_ease-out]"
                    style={{ animationFillMode: 'both' }}
                >
                    <h2 className="text-7xl font-bold text-gray-900 mb-5 text-center tracking-tight">No DMs yet</h2>
                    <p className="text-xl text-gray-400 text-center max-w-md leading-relaxed mb-12">
                        Visit a seller&apos;s profile from any listing to start a direct conversation.
                    </p>
                    <Link
                        href="/home"
                        className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-2xl transition-colors shadow-sm"
                    >
                        Browse Listings →
                    </Link>
                </div>
            </div>
        );
    }

    // ── Offers empty state ──
    return (
        <div className="flex-1 overflow-y-auto bg-gray-50">
            <div
                className="flex flex-col items-center justify-center min-h-full px-16 py-24 animate-[fadeIn_250ms_ease-out]"
                style={{ animationFillMode: 'both' }}
            >
                {/* Heading */}
                <h2 className="text-7xl font-bold text-gray-900 mb-5 text-center tracking-tight">No offers yet</h2>
                <p className="text-xl text-gray-400 text-center max-w-md leading-relaxed mb-12">
                    Send an offer on a listing to start negotiating with a seller, or post your own listing and start selling today!
                </p>

                {/* Primary CTA */}
                <Link
                    href="/home"
                    className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-2xl transition-colors shadow-sm mb-24"
                >
                    Browse Listings →
                </Link>

                {/* Listing previews or no-nearby empty state */}
                {locationReady && (
                    previewListings.length > 0 ? (
                        <div className="w-full">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-6">
                                {hasLocation ? `Available near ${city}, ${state}` : 'Popular listings'}
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {previewListings.map(listing => (
                                    <ListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        </div>
                    ) : hasLocation ? (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-3xl font-bold text-gray-700 text-center">Nothing nearby in {city}, {state}</p>
                            <p className="text-lg text-gray-400 text-center max-w-sm">Try a different location from the navbar or check back later.</p>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex-1 bg-gray-50" />}>
            <AutoSelectOrEmpty />
        </Suspense>
    );
}
