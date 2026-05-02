'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useConversations } from '../hooks';

function AutoSelectConversation() {
    const router = useRouter();
    const currentUserId = useCurrentUser();
    const { conversations, loading } = useConversations(currentUserId);

    useEffect(() => {
        if (loading || !conversations.length) return;
        router.replace(`/messages/${conversations[0].id}`);
    }, [conversations, loading, router]);

    return <div className="flex-1 bg-gray-50" />;
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="flex-1 bg-gray-50" />}>
            <AutoSelectConversation />
        </Suspense>
    );
}
