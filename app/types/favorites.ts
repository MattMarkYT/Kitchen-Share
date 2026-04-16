import { RecordModel } from "pocketbase";

export interface Favorites extends RecordModel {
    id: string;
    user: string; // ID of the user who favorited
    listing: string; // ID of the favorited listing
    created: string;
    updated: string;
}