'use client';
import Navbar from "../components/Navbar";
import styles from "./homepage.module.css";
import pb from "@/app/lib/pb";
import React, {useEffect, useState} from "react";
import {ListingCard} from "../components/ListingCard";
import {Listing} from "@/app/types/listing";

export default function Home() {
    const [listings, setListings] = useState<Listing[] | null>(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const data = await pb.collection("listings").getFullList<Listing>({ expand: "seller" });
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
            <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
                <h1 className="mb-8 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
                    Food Near You
                </h1>
                <div className={styles.flexContainer}>
                    <ul className={styles.gridLayout}>
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}

                    </ul>
                </div>
            </div>
        </main>
    );
}