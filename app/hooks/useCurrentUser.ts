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

/**
 * Hook that returns the current authenticated user's ID, or null if not logged in.
 *
 * On mount, it refreshes the auth token to verify it is still valid.
 * If the token has expired or is invalid, the auth store is cleared,
 * which will trigger a re-render and return null.
 *
 * @returns The PocketBase user ID string if authenticated, otherwise null.
 *
 * @example
 * const currentUserId = useCurrentUser();
 * if (!currentUserId) redirect('/auth');
 */

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
