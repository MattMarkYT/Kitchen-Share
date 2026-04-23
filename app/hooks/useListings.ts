import { useEffect, useState, useCallback } from "react";
import pb from "@/app/lib/pb";
import type { Listing } from "@/app/types/listing";

interface UseListingsOptions {
    city: string;
    state: string;
    enabled?: boolean;
    excludeSeller?: string | null;
    category?: string | null;
}

export function useListings({ city, state, enabled = true, excludeSeller, category }: UseListingsOptions) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchListings = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);

        try {
            const filterParts: string[] = [];

            if (city) {
                filterParts.push(`seller.city = "${city.replace(/"/g, '\\"')}"`);
            }
            if (state) {
                filterParts.push(`seller.state = "${state.replace(/"/g, '\\"')}"`);
            }
            if (excludeSeller) {
                filterParts.push(`seller != "${excludeSeller}"`);
            }
            if (category) {
                filterParts.push(`category = "${category}"`);
            }

            const filter = filterParts.length > 0 ? filterParts.join(" && ") : "";

            const data = await pb.collection("listings").getFullList<Listing>({
                expand: "seller",
                sort: "-created",
                ...(filter ? { filter } : {}),
            });

            setListings(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [city, state, enabled, excludeSeller, category]);

    useEffect(() => {
        if (enabled) {
            fetchListings();
        }
    }, [fetchListings, enabled]);

    return { listings, loading, error, refetch: fetchListings };
}
