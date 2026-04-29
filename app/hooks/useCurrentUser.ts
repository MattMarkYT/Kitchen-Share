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


let refreshPromise: Promise<void> | null = null;

/**
 * Hook that returns the current authenticated user's ID, or null if not logged in.
 *
 * On mount, it refreshes the auth token to verify it is still valid.
 * If the token has expired or is invalid, the auth store is cleared,
 * which will trigger a re-render and return null.
 *
 * @returns The PocketBase user ID string if authenticated, otherwise null.
 *
 * @example to check if user is logged in and redirect to auth page if not:
 * const currentUserId = useCurrentUser();
 *     useEffect(() => {
 *       if (!pb.authStore.isValid) {
 *          router.push("/auth");
 *       }
 *     }, [currentUserId, router]);  <--- currentUserId is used as a dependency to trigger the effect when auth state changes when a user is on the page this is called from.
 * 
 */

export function useCurrentUser() {
    const currentUserId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        if (!pb.authStore.token) return;

        if (!pb.authStore.isValid) {
            pb.authStore.clear();
            return;
        }
        if (refreshPromise) return;
        let clearedDuringRefresh = false;
        const unsubscribe = pb.authStore.onChange((token) => {
            if (!token) clearedDuringRefresh = true;
        });

        refreshPromise = pb.collection('users').authRefresh()
            .then(() => {
                if (clearedDuringRefresh) pb.authStore.clear();
            })
            .catch(() => {
                pb.authStore.clear();
            })
            .finally(() => {
                refreshPromise = null;
                unsubscribe();
            });
    }, []);

    return currentUserId;
}
