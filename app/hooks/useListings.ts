import { useEffect, useState, useCallback } from "react";
import pb from "@/app/lib/pb";
import type { Listing } from "@/app/types/listing";
import { getBlockedUserIds, getBlockedByUserIds } from "@/app/lib/blockUtils";
import { useCurrentUser } from "./useCurrentUser";

interface UseListingsOptions {
    city: string;
    state: string;
    enabled?: boolean;
    excludeSeller?: string | null;
    category?: string | null;
}

export function useListings({ city, state, enabled = true, excludeSeller, category }: UseListingsOptions) {
    const currentUserId = useCurrentUser();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchListings = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);

        try {
            // Get list of blocked user IDs (people current user blocked)
            const blockedUserIds = await getBlockedUserIds(currentUserId);
            // Get list of users who have blocked the current user
            const blockedByUserIds = await getBlockedByUserIds(currentUserId);
            // Combine both lists - exclude both blocked users AND users who blocked current user
            const allExcludedIds = [...blockedUserIds, ...blockedByUserIds];
            
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
            // Exclude listings from blocked users AND users who blocked current user
            if (allExcludedIds.length > 0) {
                const blockedFilter = allExcludedIds.map(id => `seller != "${id}"`).join(" && ");
                filterParts.push(blockedFilter);
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
    }, [city, state, enabled, excludeSeller, category, currentUserId]);

    useEffect(() => {
        if (enabled) {
            fetchListings();
        }
    }, [fetchListings, enabled]);

    return { listings, loading, error, refetch: fetchListings };
}
