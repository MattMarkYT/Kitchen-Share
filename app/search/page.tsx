'use client';
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import pb from '../lib/pb';
import { useRouter, useParams } from 'next/navigation';
import PillButton from '../components/PillButton';
import {ClientResponseError, RecordModel} from "pocketbase";

import {Listing} from "@/app/home/page";

type Result = {
    matches: number;
    listing: Listing;
};

function ListingCard({ listing }: { listing: Listing }) {
    const imgUrl =
        pb.files.getURL(listing, listing.main_image as string, { thumb: '256x256' }) ||
        '/placeholder.jpg';

    return (
        <li className="flex flex-col md:flex-row w-full bg-white rounded-lg shadow-md overflow-hidden mb-6">

            <a href={`/listing/${listing.id}`} className="md:w-48 block group relative">
                <div className="h-42 flex">
                    <img
                        src={imgUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            </a>

            <div className="flex-1 p-4 flex flex-col justify-center">
                <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                <p className="text-green-600 font-bold mt-1">${listing.price.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">{listing.location ? listing.location : "Unknown"}</p>
            </div>
        </li>
    );
}

export default function SearchPage({
                                       searchParams,
                                   }: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    let { query } = React.use(searchParams);
    query = (query == undefined || query == "") ? " " : query;

    const [listings, setListings] = useState<Listing[] | null>(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const dataBeforeFilter = await pb.collection("listings").getFullList<Listing>();

                const filterResults: Result[] = [];
                for (const listing of dataBeforeFilter) {
                    let matches = 0;
                    for (const word of query.split(" ")){
                        if (listing.title.toLowerCase().includes(word.toLowerCase())) {
                            matches++;
                            console.log(listing.title + "includes" + word);
                        }
                    }
                    if (matches > 0)
                        filterResults.push({matches, listing});
                }

                filterResults.sort((a, b) => a.matches - b.matches);

                const data: Listing[] = [];
                while (filterResults.length > 0){
                    const r = filterResults.pop();
                    if (r != undefined)
                        data.push(r.listing);
                }

                if (!cancelled) setListings(data);
            } catch (err) {
                if (!cancelled) setError(err as Error);
            } finally {
                if (!cancelled) setLoading(false);
            }

        };

        fetchData();

        return () => { cancelled = true; };
    }, [query]);

    if (loading || !listings) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-gray-500">Loading...</p></div>;

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            {listings.length > 0 ? (
                <div>
                    <h2 className="text-xl font-semibold mb-6 text-center">
                        {query == " " ? ("All Listings sorted by Newest") : ("Results for " + query)}
                    </h2>
                    <div className="flex flex-wrap justify-center max-w-4xl gap-6 mx-auto">
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} />
                        ))}
                    </div>
                </div>
            ) : (
                /* No‑results message (bigger grey text) */
                <h2 className="text-xl font-semibold mb-12 text-center">
                    Oops. No results for “{query}”
                </h2>
            )}
        </main>
    );
}
