'use client';


import type { RecordModel } from 'pocketbase';
import { useCurrentUser, useConversations } from '../hooks';
import pb from '../lib/pb';
import { formatRelativeTime } from '../lib/formatTime';
import Link from "next/link";

export default function MessagesPage() {
    const currentUserId = useCurrentUser();
    const { conversations, loading } = useConversations(currentUserId);

    if (!currentUserId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">
                    Please{' '}
                    <a href="/auth" className="text-blue-600 hover:underline">log in</a>{' '}
                    to view your messages.
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

    const getOtherUser = (convo: RecordModel) => {
        const isBuyer = convo.buyer === currentUserId;
        return isBuyer ? convo.expand?.seller : convo.expand?.buyer;
    };

    const getAvatarUrl = (user: RecordModel | undefined) => {
        if (!user?.avatar) return '';
        return pb.files.getURL(user, user.avatar);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-lg mx-auto">
                <div className="mb-6 pt-6">
                    <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
                </div>

                {conversations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <p className="text-gray-500">No conversations yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md divide-y divide-gray-100 overflow-hidden">
                        {conversations.map((convo) => {
                            const otherUser = getOtherUser(convo);
                            const avatarUrl = getAvatarUrl(otherUser);
                            const listing = convo.expand?.listing;
                            const listingImageUrl = listing?.main_image ? pb.files.getURL(listing, listing.main_image) : '';

                            return (
                                <Link
                                    key={convo.id}
                                    href={`/messages/${convo.id}`}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                                >
                                    {/* avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex items-center justify-center">
                                            {avatarUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl text-gray-400">👤</span>
                                            )}
                                        </div>
                                        {listing && listingImageUrl && (
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={listingImageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    {/* content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {otherUser?.displayName || 'Unknown'}
                                                </p>
                                                {listing ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 flex-shrink-0">
                                                        {listing.title?.length > 16 ? listing.title.slice(0, 16) + '…' : listing.title}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-400 flex-shrink-0">
                                                        DM
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                {formatRelativeTime(convo.updated)}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500 truncate mt-0.5">
                                            {convo.last_message || 'No messages yet'}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
