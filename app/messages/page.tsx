'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useConversations } from '../hooks';
import { useListings } from '../hooks/useListings';
import { ListingCard } from '../components/NewListingCard';
import Link from 'next/link';
import pb from '../lib/pb';
import type { pbuser } from '../types/pbuser';

// Auto-redirect if conversations exist
function AutoSelectOrEmpty() {
    const router = useRouter();
    const currentUserId = useCurrentUser();
    const { conversations, loading } = useConversations(currentUserId);
    const [userLocation, setUserLocation] = useState<{ city: string; state: string }>({ city: '', state: '' });
    const [locationLoaded, setLocationLoaded] = useState(false);

    // Load user location for relevant listings.
    useEffect(() => {
        if (!currentUserId) return;
        let cancelled = false;
        pb.collection('users').getOne<pbuser>(currentUserId, { requestKey: 'msg-empty-user' })
            .then(u => { if (!cancelled) setUserLocation({ city: u.city || '', state: u.state || '' }); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLocationLoaded(true); });
        return () => { cancelled = true; };
    }, [currentUserId]);

    // If there's no user, treat location as "loaded" (nothing to fetch)
    const listingsEnabled = locationLoaded || !currentUserId;

    const { listings } = useListings({
        city: userLocation.city,
        state: userLocation.state,
        enabled: listingsEnabled,
        excludeSeller: currentUserId,
    });

    const previewListings = listings.slice(0, 4);

    // Redirect to most recent conversation if one exists
    useEffect(() => {
        if (loading || !conversations.length) return;
        router.replace(`/messages/${conversations[0].id}`);
    }, [conversations, loading, router]);

    // Still loading conversations — show nothing yet
    if (loading) return <div className="flex-1 bg-gray-50" />;

    // Has conversations — redirect will kick in, show blank
    if (conversations.length > 0) return <div className="flex-1 bg-gray-50" />;

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50">
            <div
                className="flex flex-col items-center px-16 py-24 animate-[fadeIn_250ms_ease-out]"
                style={{ animationFillMode: 'both' }}
            >
                {/* Heading */}
                <h2 className="text-5xl font-bold text-gray-900 mb-4 text-center">No offers yet</h2>
                <p className="text-lg text-gray-500 text-center max-w-sm leading-relaxed mb-12">
                    Browse listings and send an offer to start a conversation with sellers.
                </p>

                {/* Primary CTA */}
                <Link
                    href="/home"
                    className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-2xl transition-colors shadow-sm mb-20"
                >
                    Browse Listings →
                </Link>

                {/* Listing previews */}
                {previewListings.length > 0 && (
                    <div className="w-full">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center mb-8">
                            {userLocation.city ? `Popular near ${userLocation.city}` : 'Explore popular listings'}
                        </p>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {previewListings.map(listing => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>

                    </div>
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
