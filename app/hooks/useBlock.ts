'use client';
import { useState, useEffect, useCallback } from 'react';
import pb from '../lib/pb';
import { useCurrentUser } from './useCurrentUser';

/**
 * useBlock — manages block/unblock between the current user and a target user.
 *
 * Usage:
 *   const { isBlocked, loading, toggle } = useBlock(sellerId);
 *   <button onClick={toggle}>{isBlocked ? 'Unblock' : 'Block'}</button>
 */
export function useBlock(targetUserId: string) {
  const currentUserId = useCurrentUser();

  const [blockRecordId, setBlockRecordId] = useState<string | null>(null); // id of the blocks record if it exists
  const [isBlocked, setIsBlocked]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [toggling, setToggling]           = useState(false);
  const [error, setError]                 = useState('');

  // On mount (or when either user changes), check if a block already exists
  useEffect(() => {
    if (!currentUserId || !targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const checkBlock = async () => {
      setLoading(true);
      try {
        const record = await pb
          .collection('blocks')
          .getFirstListItem(
            `blocker="${currentUserId}" && blockedUser="${targetUserId}"`
          );

        if (!cancelled) {
          setBlockRecordId(record.id);
          setIsBlocked(true);
        }
      } catch {
        // 404 means no block exists — that's fine
        if (!cancelled) {
          setBlockRecordId(null);
          setIsBlocked(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkBlock();
    return () => { cancelled = true; };
  }, [currentUserId, targetUserId]);

  // Toggle: create block if not blocked, delete it if blocked
  const toggle = useCallback(async () => {
    if (!currentUserId || !targetUserId || toggling) return;

    setToggling(true);
    setError('');

    try {
      if (isBlocked && blockRecordId) {
        // Unblock: delete the record
        await pb.collection('blocks').delete(blockRecordId);
        setBlockRecordId(null);
        setIsBlocked(false);
      } else {
        // Block: create a new record
        const record = await pb.collection('blocks').create({
          blocker: currentUserId,
          blockedUser: targetUserId,
        });
        setBlockRecordId(record.id);
        setIsBlocked(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setToggling(false);
    }
  }, [currentUserId, targetUserId, isBlocked, blockRecordId, toggling]);

  return { isBlocked, loading, toggling, toggle, error };
}
