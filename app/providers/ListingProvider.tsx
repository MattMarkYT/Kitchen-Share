"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import pb from "@/app/lib/pb";

type Listing = {
    id: string;
    title: string;
    description: string;
    seller: string;
    price: number;
    location: string;
    main_image: string;
    images?: string[];
    created?: string;
    updated?: string;
};

type Seller = {
    id: string;
    displayName: string;
    firstName: string;
    lastName: string;
    avatar: string;
    rating: number;
    created: string;
};

type ListingModalData = {
    listing: Listing;
    seller: Seller;
};

type ListingContextType = {
    isOnListing: boolean;
    setIsOnListing: (value: boolean) => void;
    open: boolean;
    loading: boolean;
    error: string | null;
    activeIndex: number;
    data: ListingModalData | null;
    openListing: (listingId: string) => Promise<void>;
    closeListing: () => void;
    setActiveIndex: (value: number) => void;
    nextImage: () => void;
    previousImage: () => void;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider = ({ children }: { children: ReactNode }) => {
    const [isOnListing, setIsOnListing] = useState(false);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [data, setData] = useState<ListingModalData | null>(null);

    const closeListing = useCallback(() => {
        setOpen(false);
        setError(null);
        setActiveIndex(0);
    }, []);

    const openListing = useCallback(async (listingId: string) => {
        try {
            setLoading(true);
            setError(null);
            setOpen(true);
            setActiveIndex(0);

            const listing = await pb.collection("listings").getOne<Listing>(listingId);
            const seller = await pb.collection("users").getOne<Seller>(listing.seller);

            setData({ listing, seller });
            setIsOnListing(true);
        } catch (err) {
            console.error(err);
            setData(null);
            setError("We couldn’t load this listing.");
        } finally {
            setLoading(false);
        }
    }, []);

    const imageCount = data
        ? [data.listing.main_image, ...(data.listing.images ?? [])].filter(Boolean).length
        : 0;

    const nextImage = useCallback(() => {
        if (imageCount <= 1) return;
        setActiveIndex((current) => (current === imageCount - 1 ? 0 : current + 1));
    }, [imageCount]);

    const previousImage = useCallback(() => {
        if (imageCount <= 1) return;
        setActiveIndex((current) => (current === 0 ? imageCount - 1 : current - 1));
    }, [imageCount]);

    const value = useMemo(
        () => ({
            isOnListing,
            setIsOnListing,
            open,
            loading,
            error,
            activeIndex,
            data,
            openListing,
            closeListing: () => {
                closeListing();
                setIsOnListing(false);
            },
            setActiveIndex,
            nextImage,
            previousImage,
        }),
        [
            isOnListing,
            open,
            loading,
            error,
            activeIndex,
            data,
            openListing,
            closeListing,
            nextImage,
            previousImage,
        ]
    );

    return <ListingContext.Provider value={value}>{children}</ListingContext.Provider>;
};

export const useIsListing = () => {
    const context = useContext(ListingContext);

    if (!context) {
        throw new Error("useIsListing must be used within a ListingProvider");
    }

    return context;
};
