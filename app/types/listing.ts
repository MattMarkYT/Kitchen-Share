import {RecordModel} from "pocketbase";

export interface Listing extends RecordModel {
    id: string;
    title: string;
    price: number;
    location?: string;
    main_image?: string;
    images?: string[];
    description?: string;
    tags?: string;
    created: string;
    seller: string;
    expand?: {
        seller?: {
            rating?: number | null;
        };
    };
}