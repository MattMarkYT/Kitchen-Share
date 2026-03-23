export interface pbuser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    bio: string;
    zipcode: string;
    city: string;
    state: string;
    avatar: string;
    profileSetup: boolean;
    successfulListings: number;
    rating: number | null;
    created: string;
    updated: string;
}
