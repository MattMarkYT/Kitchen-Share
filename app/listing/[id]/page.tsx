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
    rating: number;
    created: string;
};

export default function ItemPage() {
    const id = useParams().id as string
    const [listing, setListing] = useState<Listing | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.round(rating)) {
                stars.push(<span key={i} className="text-yellow-400 text-4xl">★</span>);
            } else {
                stars.push(<span key={i} className="text-gray-300 text-4xl">★</span>);
            }
        }
        return stars;
    };

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
        <div className="flex h-screen font-sans">
            <img
                src={pb.files.getURL(listing,listing.main_image, { thumb: '512x512' }) ||
                    '/placeholder.jpg'}
                alt={listing.title}
                className="w-1/2 h-full object-cover object-center"
            />
            <div className="w-1/2 p-10 border border-gray-300 rounded-lg shadow-md flex flex-col justify-center">
                <h1 className="text-6xl font-black mb-4">{listing.title}</h1>
                <p className="text-2xl mb-4"><strong>Location: </strong>{listing.location}</p>
                <p className="font-bold text-4xl mb-4">${listing.price.toFixed(2)}</p>
                <div className="flex items-center mt-2.5 mb-4">
                    <div className="w-24 h-24 mr-2.5">
                        <img className="w-full h-full object-cover object-center rounded-full"
                            src={pb.files.getURL(seller,seller.avatar, {thumb:"80x80"})}
                            alt="Seller Profile Picture"
                        />
                    </div>
                    <div>
                        <p className="text-2xl font-bold m-0">{(seller.displayName != "") ? seller.displayName : (seller.firstName+" "+seller.lastName)}</p>
                        <div className="mt-1.25 flex gap-1">
                            {renderStars(seller.rating)}
                        </div>
                        <p className="text-lg mt-1.25 m-0">Joined {new Date(seller.created).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="mt-5">
                    <PillButton>Buy Now</PillButton>
                </div>
                <p className="font-bold text-2xl mt-5">Description:</p>
                <p className="text-2xl">{listing.description}</p>
            </div>
        </div>
    );
}
