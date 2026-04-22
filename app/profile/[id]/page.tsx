'use client';
import { useState, useEffect, ChangeEvent, useRef, useMemo, useCallback } from 'react';
import pb from '../../lib/pb';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PillButton from '../../components/PillButton';
import { ClientResponseError } from "pocketbase";
import { useCurrentUser, useProfile, useStartConversation, useBlock } from '../../hooks';
import type { RecordModel } from 'pocketbase';
import usLocations from '../../lib/us-locations.json';
import { pbuser } from '@/app/types/pbuser';


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

const FormSelect = ({ label, value, onChange, children }: { label: string, value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white">
            {children}
        </select>
    </div>
);

const CityCombobox = ({ cities, value, onChange, disabled }: {
    cities: { name: string }[];
    value: string;
    onChange: (city: string) => void;
    disabled?: boolean;
}) => {
    const [input, setInput] = useState(value);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef(input);

    useEffect(() => { inputRef.current = input; }, [input]);

    const filtered = useMemo(() => {
        const q = input.trim().toLowerCase();
        if (!q) return cities.slice(0, 50);
        return cities.filter(c => c.name.toLowerCase().startsWith(q)).slice(0, 50);
    }, [input, cities]);

    useEffect(() => { setInput(value); }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                const match = cities.find(c => c.name.toLowerCase() === inputRef.current.trim().toLowerCase());
                if (!match) { setInput(''); onChange(''); }
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [cities, onChange]);

    const handleSelect = (name: string) => {
        setInput(name);
        onChange(name);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
                type="text"
                value={input}
                disabled={disabled}
                placeholder={disabled ? 'Select state first' : 'Type a city…'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100 disabled:text-gray-400"
                onChange={e => { setInput(e.target.value); setOpen(true); }}
                onFocus={() => { if (!disabled) setOpen(true); }}
            />
            {open && !disabled && filtered.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto text-sm">
                    {filtered.map(c => (
                        <li
                            key={c.name}
                            onMouseDown={() => handleSelect(c.name)}
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-800"
                        >
                            {c.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const LISTINGS_PER_PAGE = 4;

function ListingsSection({ listings, listingsLoading }: { listings: RecordModel[]; listingsLoading: boolean }) {
    const [page, setPage] = useState(0);

    if (listingsLoading) return (
        <>
            <div className="border-t border-gray-100 mx-7" />
            <div className="px-7 py-6 text-center">
                <p className="text-gray-400 text-sm">Loading listings…</p>
            </div>
        </>
    );

    if (listings.length === 0) return (
        <>
            <div className="border-t border-gray-100 mx-7" />
            <div className="px-7 pt-5 pb-7">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">Listings</p>
                <p className="text-sm text-gray-400 text-center">No listings yet.</p>
            </div>
        </>
    );

    const totalPages = Math.ceil(listings.length / LISTINGS_PER_PAGE);
    const paged = listings.slice(page * LISTINGS_PER_PAGE, (page + 1) * LISTINGS_PER_PAGE);

    return (
        <>
            <div className="border-t border-gray-100 mx-7" />
            <div className="px-7 pt-5 pb-7">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">Listings</p>
                <div className="grid grid-cols-2 gap-3">
                    {paged.map(listing => (
                        <Link
                            key={listing.id}
                            href={`/listing/${listing.id}`}
                            className="bg-gray-50 rounded-xl overflow-hidden border border-gray-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                        >
                            <div className="w-full h-36 bg-gray-100">
                                {listing.main_image ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={pb.files.getURL(listing, listing.main_image)}
                                        alt={listing.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🍽️</div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-semibold text-gray-800 truncate">{listing.title}</p>
                                <p className="text-sm text-blue-500 font-semibold mt-0.5">${listing.price?.toFixed(2)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-5">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 0}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                    i === page
                                        ? 'bg-blue-600 text-white'
                                        : 'border border-gray-200 text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page === totalPages - 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next page"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export default function ProfilePage() {
    const router = useRouter();
    const profileId = useParams().id as string;
    const currentUserId = useCurrentUser();
    const { profileUser, setProfileUser, avatarUrl, setAvatarUrl, formData, setFormData, resetForm, loading } = useProfile(profileId);
    const isOwnProfile = currentUserId === profileId;
    const isSetupMode = isOwnProfile && profileUser && !profileUser.profileSetup;
    const { startConversation: handleMessage, loading: messagingLoading, error: messagingError } = useStartConversation(profileId);
    const { isBlocked, loading: blockLoading, toggling, toggle: toggleBlock, error: blockError } = useBlock(profileId);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [blobUrl, setBlobUrl] = useState('');
    const prevBlobRef = useRef('');
    const avatarPreview = blobUrl || avatarUrl;
    const [listings, setListings] = useState<RecordModel[]>([]);
    const [listingsLoading, setListingsLoading] = useState(true);

    const usStates = usLocations.states;
    const availableCities = useMemo(() =>
            formData.state ? (usLocations.cities[formData.state as keyof typeof usLocations.cities] ?? []).map(name => ({ name })) : [],
        [formData.state]);

    // blob cleanup on unmount
    useEffect(() => {
        return () => {
            if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);
        };
    }, []);

    // load listings for this profile (only active listings, even for own profile)
    useEffect(() => {
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
    }, [profileId]);

    const handleFormChange = (field: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleCityChange = useCallback((city: string) => {
        setFormData(prev => ({ ...prev, city }));
    }, [setFormData]);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) return setError('Please upload a valid image file.');
        if (file.size > 5 * 1024 * 1024) return setError('Image size must be less than 5MB.');

        setError('');
        if (prevBlobRef.current) URL.revokeObjectURL(prevBlobRef.current);

        const previewUrl = URL.createObjectURL(file);
        prevBlobRef.current = previewUrl;
        setBlobUrl(previewUrl);
        setAvatarFile(file);
    };

    const handleSave = async () => {
        setError('');

        const { displayName, phoneNumber, zipcode, city, state } = formData;

        if (!displayName.trim()) return setError('Display name is required.');
        if (!phoneNumber.trim()) return setError('Phone number is required.');
        if (!zipcode.trim() || !city.trim() || !state.trim()) return setError('Please enter your full location (zipcode, city, state).');

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
                if (firstError?.message) return setError(firstError.message);
            }
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        resetForm();

        if (prevBlobRef.current) {
            URL.revokeObjectURL(prevBlobRef.current);
            prevBlobRef.current = '';
        }
        setBlobUrl('');
        setAvatarFile(null);
        setError('');
        setIsEditing(false);
    };

    const handleSaveAvatar = (updatedRecord: pbuser) => {
        if (prevBlobRef.current) {
            URL.revokeObjectURL(prevBlobRef.current);
            prevBlobRef.current = '';
        }
        setBlobUrl('');
        if (updatedRecord.avatar) {
            setAvatarUrl(pb.files.getURL(updatedRecord, updatedRecord.avatar));
        }
        setAvatarFile(null);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]"><p className="text-gray-400 text-sm tracking-wide">Loading…</p></div>;

    return (
        <div className="min-h-screen bg-[#f5f5f7] p-4">
            <div className="max-w-lg mx-auto">
                {/* header */}
                <div className="mb-5 pt-7">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        {isSetupMode ? 'Set up your profile' : isOwnProfile ? 'Your Profile' : formData.displayName}
                    </h1>
                    {isSetupMode && (
                        <p className="text-gray-400 text-sm mt-1">Let buyers and sellers know a bit about you before listing or messaging.</p>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* avatar + info */}
                    <div className="px-7 pt-7 pb-6 space-y-5">
                        {/* view mode: centered avatar + name */}
                        {!(isOwnProfile && (isEditing || isSetupMode)) ? (
                            <div className="flex flex-col items-center gap-3 pb-1">
                                <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-gray-300">👤</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-gray-900 tracking-tight">{formData.displayName}</p>
                                    {formData.bio && <p className="text-sm mt-1 leading-relaxed max-w-xs" style={{color:'#6B7280'}}>{formData.bio}</p>}
                                    {(formData.city || formData.state) && (
                                        <p className="text-xs text-gray-400 mt-1.5 tracking-wide flex items-center justify-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                            {formData.city}{formData.state ? `, ${formData.state}` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* edit / setup mode: centered avatar + fields */
                            <div className="space-y-5">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl text-gray-300">👤</span>
                                        )}
                                    </div>
                                    <label className="cursor-pointer">
                                        <span className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors">
                                            {avatarPreview ? 'Change photo' : 'Upload photo'}
                                        </span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <FormInput label="Display Name" value={formData.displayName} onChange={handleFormChange('displayName')} placeholder="e.g. Jane's Kitchen" />
                                <FormInput label="Phone Number" type="tel" value={formData.phoneNumber} onChange={handleFormChange('phoneNumber')} placeholder="(555) 000-0000" />
                                <FormTextarea label="Bio" value={formData.bio} onChange={handleFormChange('bio')} placeholder="Tell people a bit about yourself..." />
                                <div>
                                    <p className="block text-sm font-medium text-gray-700 mb-2">Location</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormSelect
                                            label="State"
                                            value={formData.state}
                                            onChange={e => setFormData(prev => ({ ...prev, state: e.target.value, city: '' }))}
                                        >
                                            <option value="">Select state…</option>
                                            {usStates.map(s => (
                                                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                            ))}
                                        </FormSelect>
                                        <CityCombobox
                                            cities={availableCities}
                                            value={formData.city}
                                            onChange={handleCityChange}
                                            disabled={!formData.state}
                                        />
                                    </div>
                                    <div className="mt-3">
                                        <FormInput label="Zipcode" value={formData.zipcode} onChange={handleFormChange('zipcode')} placeholder="90210" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(error || messagingError || blockError) && <p className="text-red-500 text-sm">{error || messagingError || blockError}</p>}

                        {/* actions */}
                        <div className="flex gap-2.5">
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
                                <>
                                    {!isBlocked && (
                                        <PillButton type="button" onClick={() => handleMessage()} disabled={messagingLoading} className="flex-1">
                                            {messagingLoading ? 'Opening...' : 'Message'}
                                        </PillButton>
                                    )}
                                    <PillButton type="button" onClick={toggleBlock} disabled={blockLoading || toggling} className={isBlocked ? 'w-full' : 'flex-none'}>
                                        {toggling
                                            ? (isBlocked ? 'Unblocking...' : 'Blocking...')
                                            : (isBlocked ? 'Unblock User' : 'Block')}
                                    </PillButton>
                                </>
                            )}
                        </div>
                    </div>

                    {/* stats */}
                    {!isSetupMode && (
                        <>
                            <div className="border-t border-gray-100 mx-7" />
                            <div className="flex h-18 text-center">
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-xl font-bold text-gray-900 tabular-nums">{profileUser?.successfulListings ?? 0}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Sold</p>
                                </div>
                                <div className="w-px bg-gray-100 my-3" />
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-xl font-bold text-gray-900 tabular-nums">{profileUser?.rating ? profileUser.rating.toFixed(1) : '—'}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Rating</p>
                                </div>
                                <div className="w-px bg-gray-100 my-3" />
                                <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                                    <p className="text-sm font-semibold text-gray-800">{profileUser?.city || '—'}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Location</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* active listings */}
                    {!isSetupMode && <ListingsSection listings={listings} listingsLoading={listingsLoading} />}
                </div>
            </div>
        </div>
    );
}
