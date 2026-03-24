import { useState, useEffect } from 'react';
import pb from '../lib/pb';

export function useCurrentUser() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        setCurrentUserId(pb.authStore.record?.id ?? null);

        const removeListener = pb.authStore.onChange((token, record) => {
            setCurrentUserId(record?.id ?? null);
        });
        return () => removeListener();
    }, []);

    return currentUserId;
}
