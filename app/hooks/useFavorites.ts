import { useState, useEffect } from 'react';
import pb from '../lib/pb';
import { Favorites } from '../types/favorites';
import { Listing } from '../types/listing';

export function useFavorites(userId: string | null) {
    const [favorites, setFavorites] = useState<Listing[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    const fetchFavorites = async () => {
        if (!userId) {
            setFavorites([]);
            setFavoriteIds(new Set());
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const records = await pb.collection('favorites').getFullList<Favorites>({
                filter: `user="${userId}"`,
                expand: 'listing',
            });

            const favoritedListings: Listing[] = records
                .map((record) => record.expand?.listing)
                .filter((listing): listing is Listing => listing !== undefined);

            const favoriteIdSet = new Set(records.map((record) => record.listing));

            setFavorites(favoritedListings);
            setFavoriteIds(favoriteIdSet);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
            setFavoriteIds(new Set());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [userId]);

    return { favorites, favoriteIds, loading, fetchFavorites };
}