import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import pb from '../lib/pb';
import { ClientResponseError } from 'pocketbase';
import { useCurrentUser } from './useCurrentUser';

/**
 * Usage — DM (no listing):
 *   const { startConversation, loading, error } = useStartConversation(recipientId);
 *   <button onClick={() => startConversation()}>Message</button>
 *
 * Usage — listing-attached message / offer:
 *   const { startConversation, loading, error } = useStartConversation(sellerId);
 *   <button onClick={() => startConversation(listingId)}>Make Offer</button>
 */

export function useStartConversation(userId: string) {
    const router = useRouter();
    const currentUserId = useCurrentUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const startConversation = useCallback(async (listingId?: string, initialOffer?: number) => {
        if (!currentUserId) {
            router.push('/auth');
            return;
        }

        setError('');
        setLoading(true);

        const listingFilter = listingId
            ? `listing="${listingId}"`
            : 'listing=""';

        try {
            const existing = await pb.collection('conversations').getFirstListItem(
                `((buyer="${currentUserId}" && seller="${userId}") || (buyer="${userId}" && seller="${currentUserId}")) && ${listingFilter}`
            );
            router.push('/messages/' + existing.id);
        } catch (err) {
            if (err instanceof ClientResponseError && err.status === 404) {
                try {
                    const convo = await pb.collection('conversations').create({
                        buyer: currentUserId,
                        seller: userId,
                        listing: listingId ?? '',
                        offerPrice: initialOffer ?? 0, //Changed to offerPrice to match the catergory in pocketbase
                        buyer_deleted: false,
                        seller_deleted: false,
                    });
                    router.push('/messages/' + convo.id);
                } catch (createErr) {
                    setError(createErr instanceof Error ? createErr.message : 'Could not start conversation.');
                }
            } else {
                setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [currentUserId, userId, router]);

    return { startConversation, loading, error, setError };
}

