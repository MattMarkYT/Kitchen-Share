import pb from './pb';

/**
 * Check if the current user has blocked another user.
 * @param currentUserId - The current user's ID
 * @param targetUserId - The user to check if blocked
 * @returns true if the current user has blocked the target user
 */
export async function hasBlocked(currentUserId: string | null, targetUserId: string): Promise<boolean> {
    if (!currentUserId || !targetUserId) return false;

    try {
        await pb.collection('blocks').getFirstListItem(
            pb.filter('blocker = {:blocker} && blockedUser = {:blocked}', {
                blocker: currentUserId,
                blocked: targetUserId,
            })
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if the current user is blocked by another user.
 * @param currentUserId - The current user's ID
 * @param targetUserId - The user to check if they have blocked current user
 * @returns true if the target user has blocked the current user
 */
export async function isBlockedBy(currentUserId: string | null, targetUserId: string): Promise<boolean> {
    if (!currentUserId || !targetUserId) return false;

    try {
        await pb.collection('blocks').getFirstListItem(
            pb.filter('blocker = {:blocker} && blockedUser = {:blocked}', {
                blocker: targetUserId,
                blocked: currentUserId,
            })
        );
        return true;
    } catch {
        return false;
    }
}

/**
 * Get list of user IDs that have blocked the current user.
 * @param currentUserId - The current user's ID
 * @returns Array of user IDs who have blocked the current user
 */
export async function getBlockedByUserIds(currentUserId: string | null): Promise<string[]> {
    if (!currentUserId) return [];

    try {
        const blocks = await pb.collection('blocks').getFullList({
            filter: pb.filter('blockedUser = {:userId}', { userId: currentUserId }),
            fields: 'blocker',
        });
        return blocks.map(b => b.blocker);
    } catch {
        return [];
    }
}

/**
 * Get list of user IDs that the current user has blocked.
 * @param currentUserId - The current user's ID
 * @returns Array of blocked user IDs
 */
export async function getBlockedUserIds(currentUserId: string | null): Promise<string[]> {
    if (!currentUserId) return [];

    try {
        const blocks = await pb.collection('blocks').getFullList({
            filter: pb.filter('blocker = {:userId}', { userId: currentUserId }),
            fields: 'blockedUser',
        });
        return blocks.map(b => b.blockedUser);
    } catch {
        return [];
    }
}

// Shared module-level cache — avoids duplicate block fetches when useListings
// and useFavorites are both mounted (e.g. home page). Keyed by user ID.
let _blockCacheUserId: string | null = null;
let _blockCachePromise: Promise<Set<string>> | null = null;

export function getCachedBlockedIds(userId: string | null): Promise<Set<string>> {
    if (!userId) return Promise.resolve(new Set());
    if (_blockCacheUserId === userId && _blockCachePromise) return _blockCachePromise;
    _blockCacheUserId = userId;
    _blockCachePromise = Promise.all([
        getBlockedUserIds(userId),
        getBlockedByUserIds(userId),
    ]).then(([blocked, blockedBy]) => new Set([...blocked, ...blockedBy]));
    return _blockCachePromise;
}

export function bustBlockCache(): void {
    _blockCachePromise = null;
}