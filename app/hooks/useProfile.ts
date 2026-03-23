import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import pb from '../lib/pb';
import type { pbuser } from '../types/pbuser';

export function useProfile(profileId: string) {
    const router = useRouter();
    const [profileUser, setProfileUser] = useState<pbuser | null>(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const record = await pb.collection('users').getOne(profileId);
                if (cancelled) return;

                setProfileUser(record);
                if (record.avatar) {
                    setAvatarUrl(pb.files.getURL(record, record.avatar));
                }
            } catch {
                if (!cancelled) router.push('/');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProfile();
        return () => { cancelled = true; };
    }, [profileId, router]);

    return { profileUser, setProfileUser, avatarUrl, setAvatarUrl, loading };
}
