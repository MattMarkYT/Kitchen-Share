import { useState, useEffect } from 'react';
import pb from '../lib/pb';

export function useCurrentUser() {
    const [currentUserId, setCurrentUserId] = useState<string | null>(
        pb.authStore.model?.id ?? null
    );

    useEffect(() => {
        const removeListener = pb.authStore.onChange((token, model) => {
            setCurrentUserId(model?.id ?? null);
        });
        return () => removeListener();
    }, []);

    return currentUserId;
}
