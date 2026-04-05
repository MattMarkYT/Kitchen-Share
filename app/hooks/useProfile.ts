import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import pb from '../lib/pb';
import type { pbuser } from '../types/pbuser';

function formDataFromRecord(record: pbuser | null) {
    return {
        displayName: record?.displayName || '',
        phoneNumber: record?.phoneNumber || '',
        bio: record?.bio || '',
        zipcode: record?.zipcode || '',
        city: record?.city || '',
        state: record?.state || ''
    };
}

export function useProfile(profileId: string) {
    const router = useRouter();
    const [profileUser, setProfileUser] = useState<pbuser | null>(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState(formDataFromRecord(null));

    const resetForm = useCallback(() => {
        setFormData(formDataFromRecord(profileUser));
    }, [profileUser]);

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const record = await pb.collection('users').getOne<pbuser>(profileId);
                if (cancelled) return;

                setProfileUser(record);
                setFormData(formDataFromRecord(record));

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

    return { profileUser, setProfileUser, avatarUrl, setAvatarUrl, formData, setFormData, resetForm, loading };
}
