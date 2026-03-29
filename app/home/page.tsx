'use client';
import Navbar from "../components/Navbar";
import styles from "./homepage.module.css";
import pb from "@/app/lib/pb";
import React, {useEffect, useState} from "react";

type Listing = {
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
            <a href={`/item/${listing.id}`}>
                <img src={pb.files.getURL(listing, listing.main_image as string, {thumb:"50%x50%"}) || "/placeholder.jpg"} />
                <div className={styles.cardInfo}>
                    <p className={styles.title}>{listing.title}</p>
                    <p className={styles.price}>${listing.price}</p>
                    <p className={styles.location}>{listing.location}</p>
                </div>
            </a>
        </li>
    );
}

export default function Home() {
    const [listings, setListings] = useState<Listing[] | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await pb.collection("listings").getFullList<Listing>();
            setListings(data);
        };

        fetchData();
    });

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