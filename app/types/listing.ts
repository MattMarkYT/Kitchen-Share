export type Listing = {
    id: string;
    title: string;
    price: number;
    location?: string;
    main_image?: string;
    created: string;
    seller?: string;
    expand?: {
        seller?: {
            rating?: number | null;
        };
    };
};