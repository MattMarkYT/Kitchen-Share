import { useState, useEffect } from 'react';
import pb from '../lib/pb';
import { Favorites } from '../types/favorites';
import { Listing } from '../types/listing';
import { getCachedBlockedIds } from '../lib/blockUtils';

export function useFavorites(userId: string | null) {
    const [favorites, setFavorites] = useState<Listing[]>([]);
    // map<listingId, favoriteRecordId> — lets ListingCard delete without a separate lookup
    const [favoriteIds, setFavoriteIds] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(!!userId);

    useEffect(() => {
        if (!userId) {
            setFavorites([]);
            setFavoriteIds(new Map());
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const run = async () => {
            try {
                const filter = pb.filter('user = {:userId}', { userId });

                const [records, blockedIds] = await Promise.all([
                    pb.collection('favorites').getFullList<Favorites>({
                        filter,
                        expand: 'listing',
                    }),
                    getCachedBlockedIds(userId),
                ]);

                if (cancelled) return;

                let favoritedListings: Listing[] = records
                    .map((record) => record.expand?.listing)
                    .filter((listing): listing is Listing => listing !== undefined);

                if (blockedIds.size > 0) {
                    favoritedListings = favoritedListings.filter(
                        listing => !blockedIds.has(listing.seller)
                    );
                }

                // map listingId to favoriteRecordId so ListingCard can delete correctly
                const favoriteMap = new Map(records.map((r) => [r.listing as string, r.id]));

                setFavorites(favoritedListings);
                setFavoriteIds(favoriteMap);
            } catch (error) {
                if (!cancelled) {
                    console.error('Error fetching favorites:', error);
                    setFavorites([]);
                    setFavoriteIds(new Map());
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [userId]);

    return { favorites, favoriteIds, loading };
}