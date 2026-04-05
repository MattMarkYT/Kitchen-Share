'use client';
import Navbar from "../components/Navbar";
import styles from "./homepage.module.css";
import pb from "@/app/lib/pb";
import React, {useEffect, useState} from "react";

export type Listing = {
    id: string;
    title: string;
    price: number;
    location?: string;
    main_image?: string;
    created: string;
};

function ListingCard({ listing }: { listing: Listing }) {
    return (
        <li className={styles.card}>
            <a href={`/listing/${listing.id}`}>
                <img src={pb.files.getURL(listing, listing.main_image as string, {thumb:"256x256"}) || "/placeholder.jpg"} />
                <div className={styles.cardInfo}>
                    <p className={styles.title}>{listing.title}</p>
                    <p className={styles.price}>${listing.price}</p>
                    <p className={styles.location}>{listing.location ? listing.location : "Unknown"}</p>
                </div>
            </a>
        </li>
    );
}

export default function Home() {
    const [listings, setListings] = useState<Listing[] | null>(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const data = await pb.collection("listings").getFullList<Listing>();
                if (!cancelled) setListings(data);
            } catch (err) {
                if (!cancelled) setError(err as Error);
            } finally {
                if (!cancelled) setLoading(false);
            }

        };

        fetchData();

        return () => { cancelled = true; };
    }, []);

    if (!listings) return <div>Loading...</div>;

    return (
        <main className="min-h-screen bg-white font-sans relative overflow-hidden">
            <div className={styles.flexContainer}>
                <ul className={styles.gridLayout}>
                    {listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}

                </ul>
            </div>
        </main>
    );
}