'use client';
import React, { useState, useEffect } from 'react';
import pb from "@/app/lib/pb"
import { useParams } from 'next/navigation';
import PillButton from "@/app/components/PillButton"

type Listing = {
    title: string;
    description: string;
    sellerName: string;
    sellerImage: string;
    price: number;
    location: string;
    main_image: string;
};

// Look at the Profile page. There's a folder [id]. You should look into something similar.
// It will allow you to load listing data using the id in the url
// Like localhost:3000/item/<id>
// Finally, Try to use this project's PillButton Component for better site-wide consistency

async function getListing(id: string): Promise<Listing> {
    return await pb.collection("listings").getOne<Listing>(id);
}

export default function ItemPage() {
    // Uncomment the next 2 lines when you're done and you can test your code at localhost:3000/item/123456789012345
    const id = useParams().id as string
    // const listing = getListing(id);
    const [listing, setListing] = useState<Listing | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getListing(id);
            setListing(data);
        };

        fetchData();
    }, [id]);

    if (!listing) return <div>Loading...</div>;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif', padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                    src={listing.main_image}
                    alt={listing.title}
                    style={{ width: '400px', borderRadius: '10px' }}
                />
                <div style={{ marginLeft: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}>
                    <h1 style={{ fontSize: '3em', fontWeight: 'bolder' }}>{listing.title}</h1>
                    <p style={{ fontSize: '1.2em' }}>{listing.description}</p>
                    <p style={{ fontSize: '1.2em' }}><strong>Location: </strong>{listing.location}</p>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                        <img
                            src={listing.sellerImage}
                            alt="Seller Profile Picture"
                            style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px' }}
                        />
                        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Seller: {listing.sellerName}</p>
                    </div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Price: ${listing.price.toFixed(2)}</p>
                    <PillButton>Buy Now</PillButton>
                </div>
            </div>
        </div>
    );
}
