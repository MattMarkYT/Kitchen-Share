'use client';
import { useEffect, useState, useCallback } from 'react';
import pb from '@/app/lib/pb';
import type { Listing } from '@/app/types/listing';

export function useMyListings() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMyListings = useCallback(async () => {
        const user = pb.authStore.model;
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await pb.collection('listings').getFullList<Listing>({
                filter: `seller = "${user.id}" && is_available = true`,
                sort: '-created',
                expand: 'seller',
            });
            setListings(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyListings();
    }, [fetchMyListings]);

    return { listings, loading, error, refetch: fetchMyListings };
}