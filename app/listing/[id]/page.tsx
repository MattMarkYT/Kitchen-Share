'use client';
import React, { useState, useEffect } from 'react';
import pb from "@/app/lib/pb"
import { useParams } from 'next/navigation';
import PillButton from "@/app/components/PillButton"

type Listing = {
    title: string;
    description: string;
    seller: string;
    price: number;
    location: string;
    main_image: string;
};
type Seller = {
    displayName: string;
    firstName: string;
    lastName: string;
    avatar: string;
};

export default function ItemPage() {
    const id = useParams().id as string
    const [listing, setListing] = useState<Listing | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await pb.collection("listings").getOne<Listing>(id);
            setListing(data);
            const data2 = await pb.collection("users").getOne<Seller>(data.seller);
            setSeller(data2);
        };

        fetchData();
    }, [id]);

    if (!listing) return <div>Loading...</div>;
    if (!seller) return <div>Loading...</div>;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif', padding: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                    src={pb.files.getURL(listing,listing.main_image, { thumb: '512x512' }) ||
                        '/placeholder.jpg'}
                    alt={listing.title}
                    style={{ width: '400px', height: '400px', borderRadius: '10px', objectFit:"cover", objectPosition:"center" }}
                />
                <div style={{ minWidth: '400px', marginLeft: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}>
                    <h1 style={{ fontSize: '3em', fontWeight: 'bolder' }}>{listing.title}</h1>
                    <p style={{ fontSize: '1.2em' }}>{listing.description}</p>
                    <p style={{ fontSize: '1.2em' }}><strong>Location: </strong>{listing.location}</p>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ width: '50px', height: '50px', marginRight: '10px' }}>
                            <img style={{ width: "100%", height: "100%", objectFit:"cover", objectPosition:"center", borderRadius: '50%'}}
                                src={pb.files.getURL(seller,seller.avatar, {thumb:"50x50"})}
                                alt="Seller Profile Picture"
                            />
                        </div>
                        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Seller: {(seller.displayName != "") ? seller.displayName : (seller.firstName+" "+seller.lastName)}</p>
                    </div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2em' }}>Price: ${listing.price.toFixed(2)}</p>
                    <PillButton>Buy Now</PillButton>
                </div>
            </div>
        </div>
    );
}
