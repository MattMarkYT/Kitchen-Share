import { useEffect, useRef, useState, useCallback } from "react";
import pb from "@/app/lib/pb";
import type { Listing } from "@/app/types/listing";
import { getCachedBlockedIds, bustBlockCache } from "@/app/lib/blockUtils";
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
    const hasListingsRef = useRef(false);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<Error | null>(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!enabled) return;


        let cancelled = false;

        if (!hasListingsRef.current) setLoading(true);
        setError(null);

        const run = async () => {
            try {
                const filterParts: string[] = ['is_available = true'];
                const params: Record<string, string> = {};

                if (city) {
                    filterParts.push('seller.city = {:city}');
                    params.city = city;
                }
                if (state) {
                    filterParts.push('seller.state = {:state}');
                    params.state = state;
                }
                if (excludeSeller) {
                    filterParts.push('seller != {:excludeSeller}');
                    params.excludeSeller = excludeSeller;
                }
                if (category) {
                    filterParts.push('category = {:category}');
                    params.category = category;
                }

                const filter = pb.filter(filterParts.join(' && '), params);

                // listings fetch and block cache lookup fire in parallel on first load.
                const [data, blockedIds] = await Promise.all([
                    pb.collection("listings").getList<Listing>(1, 50, {
                        expand: "seller",
                        sort: "-created",
                        filter,
                        fields: "id,collectionId,main_image,title,price,location,seller,expand.seller.rating",
                        requestKey: "useListings",
                    }),
                    getCachedBlockedIds(currentUserId),
                ]);

                if (cancelled) return;

                const items = blockedIds.size > 0
                    ? data.items.filter(l => !blockedIds.has(l.seller as string))
                    : data.items;

                // stale-while-revalidate: swap listings atomically only when new data arrives.
                setListings(items);
                hasListingsRef.current = items.length > 0;
            } catch (err) {
                if (!cancelled) setError(err as Error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [city, state, enabled, excludeSeller, category, currentUserId, tick]);

    const refetch = useCallback(() => {
        bustBlockCache(); // bust shared block cache on manual refetch
        setTick(t => t + 1);
    }, []);

    return { listings, loading, error, refetch };
}
