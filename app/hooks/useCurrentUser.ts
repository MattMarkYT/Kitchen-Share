import { useEffect, useSyncExternalStore } from 'react';
import pb from '../lib/pb';

function subscribe(onStoreChange: () => void) {
    return pb.authStore.onChange(onStoreChange);
}

function getSnapshot(): string | null {
    if (!pb.authStore.isValid) return null;
    return pb.authStore.record?.id ?? null;
}

function getServerSnapshot(): null {
    return null;
}

export function useCurrentUser() {
    const currentUserId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        if (pb.authStore.token && pb.authStore.isValid) {
            pb.collection('users').authRefresh().catch(() => {
                pb.authStore.clear();
            });
        } else if (pb.authStore.token) {
            pb.authStore.clear();
        }
    }, []);

    return currentUserId;
}
