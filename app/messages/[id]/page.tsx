'use client';

import { useState, useRef, useEffect, useMemo, useCallback, KeyboardEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser, useConversation } from '../../hooks';
import PillButton from '../../components/PillButton';
import pb from '../../lib/pb';
import { getDateKey, formatTime, formatDateSeparator } from '../../lib/formatTime';
import { hasBlocked, isBlockedBy } from '@/app/lib/blockUtils';

export default function ConversationPage() {
    const router = useRouter();
    const params = useParams();
    const conversationId = params.id as string;
    const currentUserId = useCurrentUser();
    const {
        conversation,
        messages,
        loading,
        loadingMore,
        hasMore,
        sending,
        error,
        sendMessage,
        loadMore,
        refreshConversation
    } = useConversation(conversationId, currentUserId);

    const [finalizing, setFinalizing] = useState(false);
    const [finalizationError, setFinalizationError] = useState('');
    const [localSaleStatus, setLocalSaleStatus] = useState<string | null>(null);
    const [isBlocked, setIsBlocked] = useState(false);

    // Rating state
    const [selectedRating, setSelectedRating] = useState(0);
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingError, setRatingError] = useState('');
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        setLocalSaleStatus(null);
    }, [conversation]);

    // Show "unavailable" page if the other user is blocked OR has blocked current user
    useEffect(() => {
        if (!currentUserId || !conversation) return;
        
        const otherUserId = conversation.buyer === currentUserId 
            ? conversation.seller 
            : conversation.buyer;
        
        const checkBlocked = async () => {
            const blocked = await hasBlocked(currentUserId, otherUserId);
            const blockedBy = await isBlockedBy(currentUserId, otherUserId);
            if (blocked || blockedBy) {
                setIsBlocked(true);
            }
        };
        checkBlocked();
    }, [currentUserId, conversation]);

    // Show unavailable page if blocked
    if (isBlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Conversation Unavailable</h1>
                    <p className="text-gray-600">This conversation is not available.</p>
                </div>
            </div>
        );
    }

    const handleFinalizeSale = useCallback(async (status: 'confirmed' | 'cancelled') => {
    if (!conversationId || !currentUserId) return;

    setFinalizationError('');
    setFinalizing(true);

    try {
        const finalizationMessage =
            status === 'confirmed'
                ? 'Seller has confirmed the purchase.'
                : 'Seller has cancelled the sale.';

        // 1. Update the conversation first
        await pb.collection('conversations').update(conversationId, {
            last_message: finalizationMessage,
            ...(status === 'confirmed' ? { seller_archived: true } : {}),
        });

        // 2. Create the message after the conversation update succeeds
        await pb.collection('messages').create({
            conversation: conversationId,
            sender: currentUserId,
            body: finalizationMessage,
            read: false,
        });

        // 3. Update seller stats only for confirmed sales
        if (status === 'confirmed' && conversation?.expand?.seller?.id) {
            const currentCount = Number(conversation.expand.seller.successfulListings ?? 0);
            await pb.collection('users').update(conversation.expand.seller.id, {
                successfulListings: currentCount + 1,
            });
        }

        setLocalSaleStatus(status);
        await refreshConversation();
    } catch (err: any) {
        setFinalizationError(err?.message || 'Failed to finalize sale.');
    } finally {
        setFinalizing(false);
    }
}, [conversation, conversationId, currentUserId, refreshConversation]);

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [newMessage]);

    // scroll to bottom on initial load / new message
    const prevMessageCountRef = useRef(0);
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const prevCount = prevMessageCountRef.current;
        const newCount = messages.length;
        prevMessageCountRef.current = newCount;

        if (prevCount === 0) {
            // initial load — jump straight to bottom
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        } else if (newCount > prevCount) {
            // check if the new message was appended at the bottom

            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
            if (isAtBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [messages]);

    // preserve scroll position when older messages are prepended
    const prevScrollHeightRef = useRef(0);
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        if (container.scrollTop === 0 && hasMore && !loadingMore) {
            // save scroll height
            prevScrollHeightRef.current = container.scrollHeight;
            loadMore();
        }
    }, [hasMore, loadingMore, loadMore]);


    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !prevScrollHeightRef.current) return;

        const newScrollHeight = container.scrollHeight;
        const delta = newScrollHeight - prevScrollHeightRef.current;
        if (delta > 0) {
            container.scrollTop = delta;
            prevScrollHeightRef.current = 0;
        }
    }, [messages]);

    const messagesWithDates = useMemo(() =>
            messages.map((msg, i) => ({
                msg,
                showDateSep: i === 0 || getDateKey(msg['created']) !== getDateKey(messages[i - 1]['created']),
            })),
        [messages]);

    const lastSentId = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i]['sender'] === currentUserId) return messages[i].id;
        }
        return null;
    }, [messages, currentUserId]);


    const isBuyer = conversation?.buyer === currentUserId;
    const otherUser = isBuyer ? conversation?.expand?.seller : conversation?.expand?.buyer;
    const listing = conversation?.expand?.listing;
    const otherAvatarUrl = otherUser?.avatar ? pb.files.getURL(otherUser, otherUser.avatar) : '/placeholder-avatar.png';
    const listingImageUrl = listing?.main_image ? pb.files.getURL(listing, listing.main_image) : '/placeholder.png';
    const listingPrice = listing?.price ?? -1;
    const offerPrice = conversation?.offerPrice ?? conversation?.initial_offer ?? null;
    const saleStatus =
    localSaleStatus ||
    (conversation?.last_message === "Seller has confirmed the purchase." ? "confirmed" : null);
    const canFinalizeSale = !isBuyer && !!listing && !saleStatus;

    // check if buyer already submitted a review 
    useEffect(() => {
        const checkExistingReview = async () => {
            if (!conversationId || !currentUserId || !isBuyer || saleStatus !== 'confirmed') {
                setHasReviewed(false);
                return;
            }

            try {
                const existing = await pb.collection('ratings').getFullList({
                    filter: `buyer="${currentUserId}"`,
                });

                setHasReviewed(existing.length > 0);
            } catch (error) {
                console.error('Failed to check review status:', error);
            }
        };

        checkExistingReview();
    }, [conversationId, currentUserId, isBuyer, saleStatus]);


    // buyer submits a rating after sale is confirmed

    const handleSubmitRating = useCallback(async () => {
    if (!conversation || !currentUserId || !isBuyer || selectedRating === 0) return;

    try {
        setSubmittingRating(true);
        setRatingError('');

        await pb.collection('ratings').create({
            buyer: currentUserId,
            seller: conversation.seller,
            listing: conversation.listing,
            rating: selectedRating,
        });

        // recalculate seller average rating
        const sellerReviews = await pb.collection('ratings').getFullList({
            filter: `seller="${conversation.seller}"`,
        });

        const average =
            sellerReviews.reduce((sum, review) => sum + Number(review.rating), 0) /
            sellerReviews.length;

       // await pb.collection('users').update(conversation.seller, {
         //   rating: average,
        //});

        setHasReviewed(true);
    } catch (err: any) {
        console.error("Submit rating error:", err);
        console.error("Submit rating error data:", err?.response?.data);
        setRatingError(err?.message || 'Failed to submit rating.');
    } finally {
        setSubmittingRating(false);
    }
}, [conversation, currentUserId, isBuyer, selectedRating]);

    if (!currentUserId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">
                    Please{' '}
                    <a href="/auth" className="text-blue-600 hover:underline">log in</a>{' '}
                    to view messages.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (error && !conversation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-red-500">{error}</p>
            </div>
        );
    } 

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        const msg = newMessage;
        setNewMessage('');
        await sendMessage(msg);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    console.log(`isBuyer: ${isBuyer}, listingPrice: ${listingPrice}, offerPrice: ${offerPrice}`)
    console.log("FULL CONVERSATION:", conversation);
    return (
        <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4 pt-8">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden" style={{ height: 'min(80vh, 700px)' }}>
                {/* header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <PillButton
                        onClick={() => router.push('/messages')}
                        className="text-sm py-1.5 px-4"
                    >
                        ← Back
                    </PillButton>

                    <button
                        onClick={() => otherUser?.id && router.push(`/profile/${otherUser.id}`)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    >
                    <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-200 flex items-center justify-center">
                            {otherAvatarUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={otherAvatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-base text-gray-400">👤</span>
                            )}
                        </div>
                        {listing && listingImageUrl && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-sm overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={listingImageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {otherUser?.displayName || 'Unknown'}
                            </p>
                            {listing ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 shrink-0">
                                    {listing.title?.length > 18 ? listing.title.slice(0, 18) + '…' : listing.title}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 shrink-0">
                                    DM
                                </span>
                            )}
                        </div>
                        {listing && listing.price != null && (
                            <p className="text-xs text-gray-400">${listing.price.toFixed(2)}</p>
                        )}
                    </div>
                    </button>
                </div>

                {(saleStatus || canFinalizeSale) && (
                    <div className="px-5 pb-4 border-b border-gray-100 bg-gray-50">
                        {saleStatus ? (
                            <div className="flex flex-col gap-2">
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                        saleStatus === 'confirmed'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                            : 'border-red-200 bg-red-50 text-red-900'
                                    }`}
                                >
                                    {saleStatus === 'confirmed' ? 'Sale confirmed' : 'Sale cancelled'}
                                </span>
                                <p className="text-xs text-gray-500">
                                    {saleStatus === 'confirmed'
                                        ? 'The listing has been marked unavailable.'
                                        : 'This sale has been cancelled by the seller.'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs text-gray-500">Finalize this sale when you are ready.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <PillButton
                                        type="button"
                                        onClick={() => handleFinalizeSale('cancelled')}
                                        disabled={finalizing}
                                        className="bg-gray-100 text-gray-800"
                                    >
                                        {finalizing ? '...' : 'Cancel sale'}
                                    </PillButton>
                                    <PillButton
                                        type="button"
                                        onClick={() => handleFinalizeSale('confirmed')}
                                        disabled={finalizing}
                                        className="bg-emerald-600 text-white"
                                    >
                                        {finalizing ? '...' : 'Confirm purchase'}
                                    </PillButton>
                                </div>
                                {finalizationError && (
                                    <p className="text-red-500 text-xs">{finalizationError}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}


                {/* Buyer rating area, only shows after confirmed sale */}
                {isBuyer && saleStatus === 'confirmed' && (
                    <div className="px-5 py-4 border-b border-gray-100 bg-white">
                        {hasReviewed ? (
                            <p className="text-sm text-emerald-600 font-medium">
                                Thank you! Your rating has been submitted.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {/* Small instruction */}
                                <p className="text-sm text-gray-600">Rate this seller</p>

                                {/* Clickable stars */}
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setSelectedRating(star)}
                                            className={`text-2xl transition ${
                                                star <= selectedRating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                {/* Submit button */}
                                <PillButton
                                    type="button"
                                    onClick={handleSubmitRating}
                                    disabled={submittingRating || selectedRating === 0}
                                    className="w-fit"
                                >
                                    {submittingRating ? 'Submitting...' : 'Submit Rating'}
                                </PillButton>

                                {ratingError && (
                                    <p className="text-red-500 text-xs">{ratingError}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* messages */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto px-5 py-4"
                >
                    <div className="space-y-1">
                        {/* older messages loader */}
                        {loadingMore && (
                            <p className="text-center text-gray-400 text-xs py-2">Loading...</p>
                        )}
                        {!isBuyer && listingPrice !== -1 && offerPrice != null ? (
                            offerPrice === listingPrice ? (
                                <p className="mx-auto w-fit rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-100 px-4 py-2 text-center text-xs font-medium text-emerald-900 shadow-sm">
                                    The buyer wants to buy at full price:{" "}
                                    <span className="font-bold">${listingPrice.toFixed(2)}</span>
                                </p>
                            ) : (
                                <p className="mx-auto w-fit rounded-full border border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 text-center text-xs font-medium text-blue-800 shadow-sm">
                                    The buyer is asking to pay{" "}
                                    <span className="font-bold">${offerPrice.toFixed(2)}</span>
                                </p>
                            )
                        ) : (
                            !hasMore && messages.length > 0 && (
                                <p className="text-center text-gray-400 text-xs py-2">Beginning of conversation</p>
                            )
                        )}
                        {messages.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-8">
                                No messages yet. Start the conversation!
                            </p>
                        )}

                        {messagesWithDates.map(({ msg, showDateSep }) => {
                            const isMine = msg['sender'] === currentUserId;

                            return (
                                <div key={msg.id}>
                                    {showDateSep && (
                                        <div className="flex items-center gap-3 my-4">
                                            <div className="flex-1 h-px bg-gray-100" />
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {formatDateSeparator(msg['created'])}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-100" />
                                        </div>
                                    )}

                                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                                        <div
                                            className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                                                isMine
                                                    ? 'bg-blue-600 text-white rounded-br-md'
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap wrap-break-word">{msg['body']}</p>
                                            <p className={`text-[11px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {formatTime(msg['created'])}
                                                {isMine && msg.id === lastSentId && (
                                                    <span className="ml-1.5 italic">{msg['read'] ? 'Read' : 'Sent'}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* input */}
                <div className="px-4 py-3 border-t border-gray-100">
                    <div className="flex gap-2 items-end">
                       <textarea
                           ref={textareaRef}
                           value={newMessage}
                           onChange={(e) => setNewMessage(e.target.value)}
                           onKeyDown={handleKeyDown}
                           placeholder="Type a message..."
                           rows={1}
                           className="flex-1 px-4 py-2 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none text-sm leading-5 max-h-32 overflow-y-auto"
                       />
                        <PillButton onClick={handleSend} disabled={sending || !newMessage.trim()} className="text-sm py-1.5 px-5">
                            {sending ? '...' : 'Send'}
                        </PillButton>
                    </div>
                    {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
}