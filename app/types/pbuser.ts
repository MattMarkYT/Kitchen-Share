export interface pbuser {
    id: string;
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    displayName: string; // use this for obtaining a user's name. 
    firstName: string;
    lastName: string; 
    phoneNumber: string;
    zipcode: string;
    city: string;
    state: string;
    avatar: string;
    created: string;
    updated: string;
    profileSetup: boolean;
    rating: number | null;
    successfulListings: number;
    bio: string;
}
