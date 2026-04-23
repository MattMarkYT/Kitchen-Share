'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '@/app/lib/pb';
import { useMyListings } from '@/app/hooks/useMyListings';
import type { Listing } from '@/app/types/listing';
import styles from './myListings.module.css';

function getImageUrl(listing: Listing): string | null {
    if (!listing.main_image) return null;
    return pb.files.getURL(listing, listing.main_image);
}

function handleEditListing(listing: Listing) {
    // TODO: implement edit
}

export default function MyListingsPage() {
    const router = useRouter();
    const { listings, loading, error } = useMyListings();

    useEffect(() => {
        if (!pb.authStore.isValid) {
            router.replace('/auth');
        }
    }, [router]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Listings</h1>
                <p className={styles.subtitle}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
            </div>

            {loading && (
                <div className={styles.state}>Loading your listings...</div>
            )}

            {error && (
                <div className={styles.stateError}>Failed to load listings.</div>
            )}

            {!loading && !error && listings.length === 0 && (
                <div className={styles.state}>You haven't posted any listings yet.</div>
            )}

            {!loading && !error && listings.length > 0 && (
                <div className={styles.grid}>
                    {listings.map((listing) => {
                        const imageUrl = getImageUrl(listing);
                        return (
                            <div key={listing.id} className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={listing.title}
                                            className={styles.image}
                                        />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>No Image</div>
                                    )}
                                </div>
                                <div className={styles.info}>
                                    <h2 className={styles.listingTitle}>{listing.title}</h2>
                                    <p className={styles.price}>${Number(listing.price).toFixed(2)}</p>
                                    {listing.location && (
                                        <p className={styles.location}>{listing.location}</p>
                                    )}
                                    {listing.category && (
                                        <span className={styles.category}>{listing.category}</span>
                                    )}
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.editBtn}
                                        onClick={() => handleEditListing(listing)}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
