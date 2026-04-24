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
            `blocker="${currentUserId}" && blockedUser="${targetUserId}"`
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
            `blocker="${targetUserId}" && blockedUser="${currentUserId}"`
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
            filter: `blockedUser="${currentUserId}"`,
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
            filter: `blocker="${currentUserId}"`,
        });
        return blocks.map(b => b.blockedUser);
    } catch {
        return [];
    }
}