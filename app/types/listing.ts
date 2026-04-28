import {RecordModel} from "pocketbase";

export interface Listing extends RecordModel {
    id: string;
    title: string;
    price: number;
    location?: string;
    main_image: string;
    images?: string[];
    description?: string;
    category: string;
    tags?: string;
    created: string;
    seller: string;
    is_available: boolean;
    quantity?: number;
    expand?: {
        seller?: {
            rating?: number | null;
        };
    };
}