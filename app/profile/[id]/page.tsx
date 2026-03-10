'use client';
import { useState, useEffect, ChangeEvent, useRef } from 'react';
import pb from '../../lib/pb';
import { useRouter, useParams } from 'next/navigation';
import PillButton from '../../components/PillButton';
import { ClientResponseError } from "pocketbase";


const FormInput = ({ label, type = 'text', value, onChange, placeholder = '' }: { label: string, type?: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" />
    </div>
);

const FormTextarea = ({ label, value, onChange, placeholder = '' }: { label: string, value: string, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black resize-none" />
    </div>
);

export default function ProfilePage() {
    const router = useRouter();
    const profileId = useParams().id as string;
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [profileUser, setProfileUser] = useState<any>(null);
    const isOwnProfile = currentUserId === profileId;
    const isSetupMode = isOwnProfile && profileUser && !profileUser.profileSetup;
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phoneNumber: '', bio: '', zipcode: '', city: '', state: ''
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const blobUrlRef = useRef<string | null>(null);

    // obj cleanup for url
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, []);

    //auth listener
    useEffect(() => {
        setCurrentUserId(pb.authStore.model?.id ?? null);
        const removeListener = pb.authStore.onChange((token, model) => {
            setCurrentUserId(model?.id ?? null);
        });
        return () => {
            removeListener();
        };
    }, []);
    // listener for confirm edit
    useEffect(() => {
        if (!success) return;

        const timer = setTimeout(() => {
            setSuccess('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [success]);

    // load profile
    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const record = await pb.collection('users').getOne(profileId);
                if (cancelled) return;

                setProfileUser(record);
                setFormData({
                    firstName: record.firstName || '',
                    lastName: record.lastName || '',
                    phoneNumber: record.phoneNumber || '',
                    bio: record.bio || '',
                    zipcode: record.zipcode || '',
                    city: record.city || '',
                    state: record.state || ''
                });

                if (record.avatar) {
                    setAvatarPreview(pb.files.getURL(record, record.avatar));
                }
            } catch (err) {
                if (!cancelled) router.push('/');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProfile();
        return () => { cancelled = true; };
    }, [profileId, router]);

    const handleFormChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) return setError('Please upload a valid image file.');
        if (file.size > 5 * 1024 * 1024) return setError('Image size must be less than 5MB.');

        setError('');
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);

        const previewUrl = URL.createObjectURL(file);
        blobUrlRef.current = previewUrl;
        setAvatarFile(file);
        setAvatarPreview(previewUrl);
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');

        const { firstName, lastName, phoneNumber, zipcode, city, state, bio } = formData;

        if (!firstName.trim() || !lastName.trim()) return setError('First and last name are required.');
        if (!phoneNumber.trim()) return setError('Phone number is required.');
        if (!zipcode.trim() || !city.trim() || !state.trim()) return setError('Please enter your full location (zipcode, city, state).');

        setSaving(true);

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => data.append(key, value));
            data.append('profileSetup', 'true');
            if (avatarFile) data.append('avatar', avatarFile);

            const updatedRecord = await pb.collection('users').update(profileId, data);
            await pb.collection('users').authRefresh();

            setProfileUser(updatedRecord);

            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
            if (updatedRecord.avatar) {
                setAvatarPreview(pb.files.getURL(updatedRecord, updatedRecord.avatar));
            }

            setSuccess('Profile saved!');
            setAvatarFile(null);
            setIsEditing(false);

            if (isSetupMode) router.push('/');

        } catch (err: any) {
            if (err instanceof ClientResponseError && err.response?.data) {
                const firstError = Object.values(err.response.data)[0] as any;
                if (firstError?.message) return setError(firstError.message);
            }
            setError(err?.message || 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: profileUser?.firstName || '',
            lastName: profileUser?.lastName || '',
            phoneNumber: profileUser?.phoneNumber || '',
            bio: profileUser?.bio || '',
            zipcode: profileUser?.zipcode || '',
            city: profileUser?.city || '',
            state: profileUser?.state || ''
        });

        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
        setAvatarFile(null);
        setAvatarPreview(profileUser?.avatar ? pb.files.getURL(profileUser, profileUser.avatar) : '');
        setError('');
        setIsEditing(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-gray-500">Loading...</p></div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-lg mx-auto">
                {/* header */}
                <div className="mb-6 pt-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isSetupMode ? 'Set up your profile' : isOwnProfile ? 'Your Profile' : `${formData.firstName} ${formData.lastName}`}
                    </h1>
                    {isSetupMode && (
                        <p className="text-gray-500 text-sm mt-1">Let buyers and sellers know a bit about you before listing or messaging.</p>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-md p-8 space-y-5">
                    {/* avatar */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-300 flex items-center justify-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl text-gray-400">👤</span>
                            )}
                        </div>
                        {(isOwnProfile && (isEditing || isSetupMode)) && (
                            <label className="cursor-pointer">
                                <span className="text-sm text-blue-600 hover:underline font-medium">
                                    {avatarPreview ? 'Change photo' : 'Upload photo'}
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        )}
                    </div>

                    {/* name */}
                    {(isOwnProfile && (isEditing || isSetupMode)) ? (
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="First Name" value={formData.firstName} onChange={handleFormChange('firstName')} placeholder="Jane" />
                            <FormInput label="Last Name" value={formData.lastName} onChange={handleFormChange('lastName')} placeholder="Doe" />
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-lg font-semibold text-gray-800">{formData.firstName} {formData.lastName}</p>
                            {formData.bio && <p className="text-sm text-gray-500 mt-1">{formData.bio}</p>}
                            <p className="text-sm text-gray-400 mt-1">{formData.city}{formData.state ? `, ${formData.state}` : ''}</p>
                        </div>
                    )}

                    {/* setup / edit fields */}
                    {(isOwnProfile && (isEditing || isSetupMode)) && (
                        <>
                            <FormInput label="Phone Number" type="tel" value={formData.phoneNumber} onChange={handleFormChange('phoneNumber')} placeholder="(555) 000-0000" />
                            <FormTextarea label="Bio" value={formData.bio} onChange={handleFormChange('bio')} placeholder="Tell people a bit about yourself..." />
                            <div>
                                <p className="block text-sm font-medium text-gray-700 mb-2">Location</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <FormInput label="Zipcode" value={formData.zipcode} onChange={handleFormChange('zipcode')} placeholder="90210" />
                                    <FormInput label="City" value={formData.city} onChange={handleFormChange('city')} placeholder="Los Angeles" />
                                    <FormInput label="State" value={formData.state} onChange={handleFormChange('state')} placeholder="CA" />
                                </div>
                            </div>
                        </>
                    )}

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {success && <p className="text-green-600 text-sm text-center">{success}</p>}

                    {/* actions */}
                    <div className="flex gap-3 pt-1">
                        {isSetupMode ? (
                            <PillButton type="button" onClick={handleSave} disabled={saving} className="w-full">
                                {saving ? 'Saving...' : 'Complete Setup'}
                            </PillButton>
                        ) : isOwnProfile && isEditing ? (
                            <>
                                <PillButton type="button" onClick={handleCancel} className="flex-1">Cancel</PillButton>
                                <PillButton type="button" onClick={handleSave} disabled={saving} className="flex-1">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </PillButton>
                            </>
                        ) : isOwnProfile ? (
                            <PillButton type="button" onClick={() => setIsEditing(true)} className="w-full">Edit Profile</PillButton>
                        ) : (
                            <PillButton type="button" onClick={() => !currentUserId && router.push('/auth?redirect=/profile/' + profileId)} className="w-full">
                                Message
                            </PillButton>
                        )}
                    </div>
                </div>

                {/* stats */}
                {!isSetupMode && (
                    <div className="mt-4 bg-white rounded-xl shadow-md p-6 flex h-20 text-center">
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold text-gray-800">{profileUser?.successfulListings ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Successful Listings</p>
                        </div>
                        <div className="w-px bg-gray-200" />
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="text-2xl font-bold text-gray-800">{profileUser?.rating ? profileUser.rating.toFixed(1) : '—'}</p>
                            <p className="text-xs text-gray-500 mt-1">Rating</p>
                        </div>
                        <div className="w-px bg-gray-200" />
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <p className="text-sm font-medium text-gray-800">{profileUser?.city || '—'}</p>
                            <p className="text-xs text-gray-500 mt-1">Location</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
