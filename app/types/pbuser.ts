import type { RecordModel } from 'pocketbase';

export interface pbuser extends RecordModel {
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    displayName: string; // use this to get a user's name
    firstName: string;
    lastName: string;
    phoneNumber: string;
    zipcode: string;
    city: string;
    state: string;
    avatar: string;
    profileSetup: boolean;
    rating: number | null;
    successfulListings: number;
    bio: string;
}
