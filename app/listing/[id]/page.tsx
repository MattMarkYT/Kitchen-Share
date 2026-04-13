'use client';
import React, { useState, useEffect } from 'react';
import pb from "@/app/lib/pb"
import { useParams, useRouter } from 'next/navigation';
import PillButton from "@/app/components/PillButton"
import {useStartConversation} from "../../hooks";

type Listing = {
    title: string;
    description: string;
    seller: string;
    price: number;
    location: string;
    main_image: string;
    images?: string[];
};

type Seller = {
    displayName: string;
    firstName: string;
    lastName: string;
    avatar: string;
    rating: number;
    created: string;
    id: string;
};

export default function ItemPage() {
    const id = useParams().id as string
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { startConversation: handleMessage, loading: messagingLoading, error: messagingError } = useStartConversation(seller?.id || '');


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
        <div className="flex h-screen font-sans items-center justify-center bg-gray-100">
            <div className="transform scale-90 origin-center">
                <div className="flex h-screen w-screen rounded-lg shadow-lg overflow-hidden">
                    {/* Left Thumbnail Gallery */}
                    <div className="w-24 h-full bg-gray-100 flex flex-col gap-2 p-2 overflow-y-auto">
                        {/* Main Image Thumbnail */}
                        <img
                            src={pb.files.getURL(listing, listing.main_image, { thumb: '80x80' }) || '/placeholder.jpg'}
                            alt={`${listing.title} - Main`}
                            onClick={() => setCurrentImageIndex(0)}
                            className={`w-20 h-20 object-cover cursor-pointer rounded transition-all ${
                                currentImageIndex === 0 ? 'ring-2 ring-blue-500 ring-offset-2' : 'opacity-60 hover:opacity-100'
                            }`}
                        />
                        {/* Additional Images */}
                        {listing.images && listing.images.length > 0 && (
                            listing.images.map((image, index) => (
                                <img
                                    key={index + 1}
                                    src={pb.files.getURL(listing, image, { thumb: '80x80' }) || '/placeholder.jpg'}
                                    alt={`${listing.title} ${index + 1}`}
                                    onClick={() => setCurrentImageIndex(index + 1)}
                                    className={`w-20 h-20 object-cover cursor-pointer rounded transition-all ${
                                        currentImageIndex === index + 1 ? 'ring-2 ring-blue-500 ring-offset-2' : 'opacity-60 hover:opacity-100'
                                    }`}
                                />
                            ))
                        )}
                    </div>
                    {/* Main Image Display */}
                    <div className="flex-2 h-full bg-white flex items-center justify-center">
                        <img
                            src={pb.files.getURL(listing, currentImageIndex === 0 ? listing.main_image : listing.images?.[currentImageIndex - 1] as string, { thumb: '512x512' }) ||
                                '/placeholder.jpg'}
                            alt={listing.title}
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                    {/* Right Info Panel */}
                    <div className="flex-1 p-10 flex flex-col justify-center bg-white border-l border-gray-200">
                        <h1 className="text-6xl font-black mb-4">{listing.title}</h1>
                        <p className="text-2xl mb-4"><strong>Location: </strong>{listing.location}</p>
                        <p className="font-bold text-4xl mb-4">${listing.price.toFixed(2)}</p>
                        <div className="flex items-center mt-2.5 mb-4 cursor-pointer" onClick={() => router.push(`/profile/${seller.id}`)}>
                            <div className="w-24 h-24 mr-2.5">
                                <img className="w-full h-full object-cover object-center rounded-full hover:opacity-80 transition-opacity"
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
                        <div className="mt-5 flex gap-4">
                            <PillButton type="button" onClick={() => handleMessage(id)} disabled={messagingLoading} className="w-full">
                                {messagingLoading ? 'Opening...' : 'Buy'}
                            </PillButton>

                            <PillButton type="button" onClick={() => handleMessage(id)} disabled={messagingLoading} className="w-full">
                                {messagingLoading ? 'Opening...' : 'Make Offer'}
                            </PillButton>
                        </div>
                        <p className="font-bold text-2xl mt-5">Description:</p>
                        <p className="text-2xl">{listing.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}