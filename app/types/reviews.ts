import { RecordModel } from "pocketbase";

export interface Review extends RecordModel {
    buyer: string;
    seller: string;
    listing: string;
    conversation: string;
    rating: number;
    created: string;
    updated: string;
}