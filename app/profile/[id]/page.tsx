'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {useParams, usePathname, useRouter} from 'next/navigation';
import type { RecordModel } from 'pocketbase';
import { ClientResponseError } from 'pocketbase';

import { useCurrentUser, useProfile, useStartConversation, useBlock } from '@/app/hooks';
import { useIsMobile } from '@/app/hooks/useIsMobile';
import { isBlockedBy } from '@/app/lib/blockUtils';
import pb from '@/app/lib/pb';
import usLocations from '@/app/lib/us-locations.json';
import type { pbuser } from '@/app/types/pbuser';

import {
    ListingsSection,
    LoadingState,
    MAX_AVATAR_SIZE,
    PageTitle,
    ProfileActions,
    ProfileEditor,
    ProfileHero,
    type ProfileFormData,
    ProfileStats,
    ProfileView,
    UnavailableState, Avatar,
} from '@/app/profile/profilePage';
import {useIsLogin} from "@/app/providers/LoginProvider";

export default function ProfilePage() {
    const router = useRouter();
    const profileId = useParams().id as string;
    const currentUserId = useCurrentUser();
    const isMobile = useIsMobile();

    const {
        profileUser,
        setProfileUser,
        avatarUrl,
        setAvatarUrl,
        formData,
        setFormData,
        resetForm,
        loading,
    } = useProfile(profileId);

    const isOwnProfile = currentUserId === profileId;
    const isSetupMode = Boolean(isOwnProfile && profileUser && !profileUser.profileSetup);
    const { startConversation: handleMessage, loading: messagingLoading, error: messagingError } = useStartConversation(profileId);
    const { isBlocked, loading: blockLoading, toggling, toggle: toggleBlock, error: blockError } = useBlock(profileId);

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [blobUrl, setBlobUrl] = useState('');
    const [listings, setListings] = useState<RecordModel[]>([]);
    const [listingsLoading, setListingsLoading] = useState(true);
    const [isUnavailable, setIsUnavailable] = useState(false);

    const prevBlobRef = useRef('');
    const avatarPreview = blobUrl || avatarUrl;

    const availableCities = useMemo(() => {
        if (!formData.state) return [];
        const cities = usLocations.cities[formData.state as keyof typeof usLocations.cities] ?? [];
        return cities.map(name => ({ name }));
    }, [formData.state]);

    useEffect(() => {
        return () => {
            if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        if (!currentUserId || isOwnProfile || loading) {
            setIsUnavailable(false);
            return;
        }

        const checkBlockedStatus = async () => {
            const blockedByProfile = await isBlockedBy(currentUserId, profileId);
            if (!cancelled) setIsUnavailable(blockedByProfile);
        };

        checkBlockedStatus();
        return () => { cancelled = true; };
    }, [currentUserId, profileId, isOwnProfile, loading]);

    useEffect(() => {
        if (isUnavailable) {
            setListings([]);
            setListingsLoading(false);
            return;
        }

        let cancelled = false;
        setListingsLoading(true);

        pb.collection('listings').getFullList({
            filter: `seller="${profileId}" && is_available=true`,
            sort: '-created',
        }).then(result => {
            if (!cancelled) setListings(result);
        }).catch(() => {
            if (!cancelled) setListings([]);
        }).finally(() => {
            if (!cancelled) setListingsLoading(false);
        });

        return () => { cancelled = true; };
    }, [profileId, isUnavailable]);

    const updateFormField = (field: keyof ProfileFormData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(previous => ({ ...previous, [field]: event.target.value }));
    };

    const updateCity = useCallback((city: string) => {
        setFormData(previous => ({ ...previous, city }));
    }, [setFormData]);

    const updateState = (event: ChangeEvent<HTMLSelectElement>) => {
        setFormData(previous => ({ ...previous, state: event.target.value, city: '' }));
    };

    const clearAvatarPreview = () => {
        if (prevBlobRef.current) {
            URL.revokeObjectURL(prevBlobRef.current);
            prevBlobRef.current = '';
        }
        setBlobUrl('');
        setAvatarFile(null);
    };

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file.');
            return;
        }

        if (file.size > MAX_AVATAR_SIZE) {
            setError('Image size must be less than 5MB.');
            return;
        }

        setError('');
        clearAvatarPreview();

        const previewUrl = URL.createObjectURL(file);
        prevBlobRef.current = previewUrl;
        setBlobUrl(previewUrl);
        setAvatarFile(file);
    };

    const handleSaveAvatar = (updatedRecord: pbuser) => {
        clearAvatarPreview();
        if (updatedRecord.avatar) setAvatarUrl(pb.files.getURL(updatedRecord, updatedRecord.avatar));
    };

    const validateForm = () => {
        const { displayName, phoneNumber, zipcode, city, state } = formData;

        if (!displayName.trim()) return 'Display name is required.';
        if (!phoneNumber.trim()) return 'Phone number is required.';
        if (!zipcode.trim() || !city.trim() || !state.trim()) return 'Please enter your full location (zipcode, city, state).';

        return '';
    };

    const handleSave = async () => {
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => data.append(key, value));
            data.append('profileSetup', 'true');
            if (avatarFile) data.append('avatar', avatarFile);

            const updatedRecord = await pb.collection('users').update<pbuser>(profileId, data);
            await pb.collection('users').authRefresh();

            setProfileUser(updatedRecord);
            handleSaveAvatar(updatedRecord);
            setIsEditing(false);

            if (isSetupMode) router.push('/');
        } catch (err) {
            if (err instanceof ClientResponseError && err.response?.data) {
                const firstError = Object.values(err.response.data)[0] as { message?: string };
                if (firstError?.message) {
                    setError(firstError.message);
                    return;
                }
            }

            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        clearAvatarPreview();
        setError('');
        setIsEditing(false);
    };
    const {setIsOnLogin} = useIsLogin();

    if (loading) return <LoadingState />;
    if (isUnavailable) return <UnavailableState />;

    const visibleError = error || messagingError || blockError;
    const isEditingProfile = isOwnProfile && (isEditing || isSetupMode);


    return (
        <main className="min-h-screen bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8 lg:py-7 mb-40 md:mb-0">
            <div className="mx-auto w-full max-w-[1500px]">
                <PageTitle isSetupMode={isSetupMode} isOwnProfile={isOwnProfile} displayName={formData.displayName} />

                <ProfileHero error={visibleError}>
                    <div className="space-y-6">
                        {isEditingProfile ? (
                            <div className="flex flex-col gap-12">
                            <ProfileEditor
                                avatarPreview={avatarPreview}
                                formData={formData}
                                availableCities={availableCities}
                                onAvatarChange={handleAvatarChange}
                                onCityChange={updateCity}
                                onFormChange={updateFormField}
                                onStateChange={updateState}
                            />
                            <ProfileActions
                                isSetupMode={isSetupMode}
                                isOwnProfile={isOwnProfile}
                                isEditing={isEditing}
                                isBlocked={isBlocked}
                                saving={saving}
                                messagingLoading={messagingLoading}
                                blockLoading={blockLoading}
                                toggling={toggling}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onEdit={() => setIsEditing(true)}
                                onMessage={() => {if (currentUserId) handleMessage(); else setIsOnLogin(true);}}
                                onToggleBlock={() => {if (currentUserId) toggleBlock(); else setIsOnLogin(true);}}
                            />
                            </div>
                        ) : (
                            <div className={"relative justify-center items-center flex flex-col md:flex-row gap-10"}>
                                <Avatar avatarPreview={avatarPreview}/>
                                <div className={"flex flex-col gap-6"}>
                                    <ProfileView profileUser={profileUser} formData={formData} />
                                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
                                        <ProfileActions
                                            isSetupMode={isSetupMode}
                                            isOwnProfile={isOwnProfile}
                                            isEditing={isEditing}
                                            isBlocked={isBlocked}
                                            saving={saving}
                                            messagingLoading={messagingLoading}
                                            blockLoading={blockLoading}
                                            toggling={toggling}
                                            onSave={handleSave}
                                            onCancel={handleCancel}
                                            onEdit={() => setIsEditing(true)}
                                            onMessage={() => {if (currentUserId) handleMessage(); else setIsOnLogin(true);}}
                                            onToggleBlock={() => {if (currentUserId) toggleBlock(); else setIsOnLogin(true);}}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </ProfileHero>

                {!isSetupMode && <ListingsSection listings={listings} listingsLoading={listingsLoading} isMobile={isMobile} />}
            </div>
        </main>
    );
}
