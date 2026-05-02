'use client';
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import pb from "@/app/lib/pb";
import { ClientResponseError } from "pocketbase";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/hooks";
import { CATEGORY_OPTIONS } from "@/app/types/categories";
import { setAuthRedirect } from "@/app/api/authRedirect";
import usLocations from "@/app/lib/us-locations.json";
import { MapPin, Clock3, Heart, Share2 } from "lucide-react";

const MAX_PHOTOS = 6;
const MAX_TITLE = 60;
const MAX_DESC = 500;

type Errors = {
    title?: string;
    price?: string;
    location?: string;
    images?: string;
    category?: string;
};

export default function CreateListing() {
    const router = useRouter();

    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [price, setPrice] = useState("");
    const [title, setTitle] = useState("");
    const [locationState, setLocationState] = useState("");
    const [locationCity, setLocationCity] = useState("");
    const [category, setCategory] = useState("");
    const [additionalTags, setAdditionalTags] = useState("");
    const [description, setDescription] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const usStates = usLocations.states;
    const availableCities = useMemo(() =>
        locationState ? (usLocations.cities[locationState as keyof typeof usLocations.cities] ?? []).map(name => ({ name })) : [],
        [locationState]);

    const handleCityChange = useCallback((city: string) => {
        setLocationCity(city);
        setErrors(p => ({ ...p, location: undefined }));
    }, [setErrors]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const currentUserId = useCurrentUser();

    useEffect(() => {
        if (!pb.authStore.isValid) {
            setAuthRedirect();
            router.push("/auth");
        }
    }, [currentUserId, router]);

    // Pre-populate location from the user's profile
    useEffect(() => {
        const record = pb.authStore.record;
        if (record) {
            if (record.state) setLocationState(record.state);
            if (record.city) setLocationCity(record.city);
        }
    }, []);

    if (!currentUserId) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
                <p style={{ color: "#6b7280" }}>Loading...</p>
            </div>
        );
    }

    function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const remaining = MAX_PHOTOS - images.length;
        const toAdd = files.slice(0, remaining);
        setImages(prev => [...prev, ...toAdd]);
        setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
        setErrors(prev => ({ ...prev, images: undefined }));
    }

    function handleRemoveImage(index: number) {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    }

    function validate(): boolean {
        const newErrors: Errors = {};
        if (!title.trim()) newErrors.title = "Title is required";
        if (!price || isNaN(Number(price)) || Number(price) < 0) newErrors.price = "Valid price is required";
        if (!locationCity.trim()) newErrors.location = "City is required";
        if (!category.trim()) newErrors.category = "Category is required";
        if (images.length === 0) newErrors.images = "Please upload at least one photo";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
            const data = new FormData();
            data.append("title", title.trim());
            data.append("price", price);
            data.append("location", locationCity.trim());
            data.append("category", category);
            data.append("tags", additionalTags.trim());
            data.append("description", description.trim());
            data.append("seller", pb.authStore.record?.id ?? "");
            data.append("is_available", "true");

            data.append("main_image", images[0]);
            for (let i = 1; i < images.length; i++) {
                data.append("images", images[i]);
            }
            await pb.collection("listings").create(data);
            router.push("/");
        } catch (err) {
            console.error(err);
            if (err instanceof ClientResponseError && err.response?.data) {
                const [field, value] = Object.entries(err.response.data)[0] as [string, { message?: string }];
                const message = value?.message ?? String(value);
                setSubmitError(`${field}: ${message}`);
            } else {
                setSubmitError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2rem", alignItems: "start" }}>

                {/* ── LEFT COLUMN ── */}
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111", marginBottom: "0.25rem" }}>
                        Create your listing
                    </h1>
                    <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.95rem" }}>
                        Share your homemade food with neighbors in your community.
                    </p>

                    {/* ── SECTION 1: Photos ── */}
                    <Section number={1} title="Add Photos" subtitle="Show off your delicious food">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={handleImages}
                        />
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {/* Upload slot — always first if under max */}
                            {images.length < MAX_PHOTOS && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: 110, height: 110, border: "2px dashed #d1d5db",
                                        borderRadius: 10, cursor: "pointer", background: "#fff",
                                        display: "flex", flexDirection: "column", alignItems: "center",
                                        justifyContent: "center", color: "#9ca3af", gap: 4,
                                        transition: "border-color 0.15s",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#e97316")}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#d1d5db")}
                                >
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    <span style={{ fontSize: "0.75rem" }}>Add photos</span>
                                    <span style={{ fontSize: "0.7rem", color: "#d1d5db" }}>Upload up to {MAX_PHOTOS}</span>
                                </div>
                            )}

                            {/* Preview slots */}
                            {previews.map((src, i) => (
                                <div key={i} style={{ position: "relative", width: 110, height: 110, borderRadius: 10, overflow: "hidden" }}>
                                    <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    {i === 0 && (
                                        <span style={{
                                            position: "absolute", bottom: 4, left: 4,
                                            background: "rgba(0,0,0,0.55)", color: "#fff",
                                            fontSize: "0.65rem", padding: "2px 6px", borderRadius: 4,
                                        }}>Main</span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(i)}
                                        style={{
                                            position: "absolute", top: 4, right: 4,
                                            width: 20, height: 20, borderRadius: "50%",
                                            background: "#ef4444", border: "none", color: "#fff",
                                            cursor: "pointer", fontSize: 11,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}
                                    >✕</button>
                                </div>
                            ))}

                            {/* Empty placeholder slots */}
                            {Array.from({ length: Math.max(0, MAX_PHOTOS - images.length - 1) }).map((_, i) => (
                                <div key={`empty-${i}`} style={{
                                    width: 110, height: 110, borderRadius: 10,
                                    border: "1px solid #e5e7eb", background: "#f9fafb",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <svg width="20" height="20" fill="none" stroke="#d1d5db" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="M21 15l-5-5L5 21" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                        {errors.images && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.5rem" }}>{errors.images}</p>}
                        <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.5rem" }}>Good photos help your listing stand out!</p>
                    </Section>

                    {/* ── SECTION 2: Basic Info ── */}
                    <Section number={2} title="Basic Information">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <FieldLabel required>Title</FieldLabel>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        maxLength={MAX_TITLE}
                                        placeholder="e.g. Homemade Lasagna"
                                        value={title}
                                        onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
                                        style={inputStyle(!!errors.title)}
                                    />
                                    <span style={{ position: "absolute", right: 10, bottom: 8, fontSize: "0.7rem", color: "#9ca3af" }}>
                                        {title.length}/{MAX_TITLE}
                                    </span>
                                </div>
                                {errors.title && <ErrMsg>{errors.title}</ErrMsg>}
                            </div>
                            <div>
                                <FieldLabel required>Price</FieldLabel>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: 500 }}>$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={e => { setPrice(e.target.value); setErrors(p => ({ ...p, price: undefined })); }}
                                        style={{ ...inputStyle(!!errors.price), paddingLeft: "1.75rem" }}
                                    />
                                </div>
                                {errors.price && <ErrMsg>{errors.price}</ErrMsg>}
                            </div>
                            <div>
                                <FieldLabel required>Location</FieldLabel>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                    <div>
                                        <select
                                            value={locationState}
                                            onChange={e => {
                                                setLocationState(e.target.value);
                                                setLocationCity("");
                                                setErrors(p => ({ ...p, location: undefined }));
                                            }}
                                            style={inputStyle(false)}
                                        >
                                            <option value="">Select state…</option>
                                            {usStates.map(s => (
                                                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <CityCombobox
                                        cities={availableCities}
                                        value={locationCity}
                                        onChange={handleCityChange}
                                        disabled={!locationState}
                                        hasError={!!errors.location}
                                    />
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>Where is your food available for pickup?</p>
                                {errors.location && <ErrMsg>{errors.location}</ErrMsg>}
                            </div>
                            <div>
                                <FieldLabel required>Category</FieldLabel>
                                <select
                                    value={category}
                                    onChange={e => { setCategory(e.target.value); setErrors(p => ({ ...p, category: undefined })); }}
                                    style={inputStyle(!!errors.category)}
                                >
                                    <option value="">Select a category</option>
                                    {CATEGORY_OPTIONS.map(opt => (
                                        <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
                                            {typeof opt === "string" ? opt : opt.label}
                                        </option>
                                    ))}
                                </select>
                                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>What type of food is this?</p>
                                {errors.category && <ErrMsg>{errors.category}</ErrMsg>}
                            </div>
                        </div>
                    </Section>

                    {/* ── SECTION 3: Details ── */}
                    <Section number={3} title="Details">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <FieldLabel>Description</FieldLabel>
                                <div style={{ position: "relative" }}>
                                    <textarea
                                        placeholder="Tell buyers about your food..."
                                        maxLength={MAX_DESC}
                                        rows={5}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        style={{ ...inputStyle(false), resize: "vertical", fontFamily: "inherit" }}
                                    />
                                    <span style={{ position: "absolute", right: 10, bottom: 8, fontSize: "0.7rem", color: "#9ca3af" }}>
                                        {description.length}/{MAX_DESC}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <FieldLabel>Tags <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></FieldLabel>
                                <input
                                    type="text"
                                    placeholder="Add tags..."
                                    value={additionalTags}
                                    onChange={e => setAdditionalTags(e.target.value)}
                                    style={inputStyle(false)}
                                />
                                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 4 }}>Add keywords to help buyers find your listing</p>
                            </div>
                        </div>
                    </Section>

                    {/* ── Confirmation checkbox + Submit ── */}
                    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem" }}>
                        <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", cursor: "pointer", flex: 1 }}>
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={e => setConfirmed(e.target.checked)}
                                style={{ marginTop: 3, accentColor: "#e97316", width: 16, height: 16, cursor: "pointer" }}
                            />
                            <div>
                                <p style={{ fontSize: "0.9rem", color: "#111", fontWeight: 500, margin: 0 }}>
                                    I confirm that this food is homemade and prepared in a home kitchen.
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "2px 0 0" }}>
                                    Please follow all food safety guidelines.
                                </p>
                            </div>
                        </label>

                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexShrink: 0 }}>
                            {submitError && (
                                <p style={{ color: "#ef4444", fontSize: "0.8rem", margin: 0 }}>{submitError}</p>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || !confirmed}
                                style={{
                                    padding: "0.7rem 1.75rem",
                                    background: submitting || !confirmed ? "#d1d5db" : "#e97316",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 10,
                                    fontWeight: 600,
                                    fontSize: "0.95rem",
                                    cursor: submitting || !confirmed ? "not-allowed" : "pointer",
                                    fontFamily: "inherit",
                                    transition: "background 0.2s",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {submitting ? "Publishing..." : "Publish Listing"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: Sticky Preview + Tips ── */}
                <div style={{ position: "sticky", top: "1.5rem" }}>

                    {/* Preview card */}
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem", textAlign: "center" }}>Live preview</p>
                    <ListingCardPreview
                        title={title.trim() || "Your listing title"}
                        price={price && !isNaN(Number(price)) ? Number(price) : 0}
                        location={locationCity || "Your city"}
                        category={category}
                        imageUrl={previews[0] || null}
                        sellerName={pb.authStore.record?.displayName || "You"}
                    />

                    {/* Tips */}
                    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "1rem" }}>
                        <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111", marginBottom: "0.85rem" }}>Tips for a Great Listing</p>
                        {[
                            { icon: "📷", title: "Use bright, clear photos", sub: "Good photos get more attention" },
                            { icon: "📝", title: "Write a detailed description", sub: "Tell buyers what makes your food special" },
                            { icon: "💲", title: "Be accurate with pricing", sub: "Fair prices sell faster" },
                            { icon: "🥜", title: "Include dietary information", sub: "Help buyers make informed choices" },
                        ].map(tip => (
                            <div key={tip.title} style={{ display: "flex", gap: "0.65rem", marginBottom: "0.75rem", alignItems: "flex-start" }}>
                                <span style={{ fontSize: "1rem", marginTop: 1 }}>{tip.icon}</span>
                                <div>
                                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151", margin: 0 }}>{tip.title}</p>
                                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "1px 0 0" }}>{tip.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Small helper components ── */

function ListingCardPreview({ title, price, location, category, imageUrl, sellerName }: {
    title: string;
    price: number;
    location: string;
    category: string;
    imageUrl: string | null;
    sellerName: string;
}) {
    const badgeOption = CATEGORY_OPTIONS.find(c => (typeof c === "string" ? c : c.value) === category);
    const badgeLabel = badgeOption ? (typeof badgeOption === "string" ? badgeOption : badgeOption.label) : null;
    const badgeClass = badgeLabel === "Popular"
        ? "bg-violet-100 text-violet-700"
        : "bg-lime-100 text-lime-700";
    const initials = sellerName.slice(0, 2).toUpperCase();

    return (
        <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_8px_24px_rgba(28,25,23,0.06)] mb-5">
            {/* Image */}
            <div className="relative overflow-hidden bg-stone-100" style={{ aspectRatio: "1.5/1" }}>
                {imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-stone-300">
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </div>
                )}
                {badgeLabel && (
                    <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${badgeClass}`}>
                        {badgeLabel}
                    </div>
                )}
                <button type="button" disabled className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center text-stone-700 opacity-60">
                    <Heart className="h-6 w-6 stroke-[2.2] fill-none text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-stone-900 shadow-sm">
                    ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </div>

            {/* Info */}
            <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-stone-900">{title}</h3>
                        <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{location}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                    <div className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>Available now</span>
                    </div>
                    <button type="button" disabled className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-400">
                        <Share2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 border-t border-stone-100 pt-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-600 shrink-0">
                        {initials}
                    </div>
                    <span className="truncate text-xs font-medium text-stone-700">{sellerName}</span>
                </div>
            </div>
        </div>
    );
}

function CityCombobox({ cities, value, onChange, disabled, hasError }: {
    cities: { name: string }[];
    value: string;
    onChange: (city: string) => void;
    disabled?: boolean;
    hasError?: boolean;
}) {
    const [input, setInput] = useState(value);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef(input);

    useEffect(() => { inputRef.current = input; }, [input]);
    useEffect(() => { setInput(value); }, [value]);

    const filtered = useMemo(() => {
        const q = input.trim().toLowerCase();
        if (!q) return cities.slice(0, 50);
        return cities.filter(c => c.name.toLowerCase().startsWith(q)).slice(0, 50);
    }, [input, cities]);

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

    return (
        <div ref={containerRef} style={{ position: "relative" }}>
            <input
                type="text"
                value={input}
                disabled={disabled}
                placeholder={disabled ? 'Select state first' : 'Type a city…'}
                style={{
                    ...inputStyle(!!hasError),
                    background: disabled ? "#f9fafb" : "#fff",
                    color: disabled ? "#9ca3af" : "#111",
                }}
                onChange={e => { setInput(e.target.value); setOpen(true); }}
                onFocus={() => { if (!disabled) setOpen(true); }}
            />
            {open && !disabled && filtered.length > 0 && (
                <ul style={{
                    position: "absolute", zIndex: 20, marginTop: 4, width: "100%",
                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)", maxHeight: 192,
                    overflowY: "auto", fontSize: "0.875rem", listStyle: "none",
                    padding: 0, margin: "4px 0 0",
                }}>
                    {filtered.map(c => (
                        <li
                            key={c.name}
                            onMouseDown={() => { setInput(c.name); onChange(c.name); setOpen(false); }}
                            style={{ padding: "0.5rem 0.75rem", cursor: "pointer", color: "#374151" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}
                        >
                            {c.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Section({ number, title, subtitle, children }: {
    number: number; title: string; subtitle?: string; children: React.ReactNode;
}) {
    return (
        <div style={{
            background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
            padding: "1.5rem", marginBottom: "1.25rem",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: subtitle ? "0.2rem" : "1rem" }}>
                <span style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#e97316", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                }}>{number}</span>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#111", margin: 0 }}>{title}</h2>
            </div>
            {subtitle && <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "1rem", marginLeft: "2.4rem" }}>{subtitle}</p>}
            {children}
        </div>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.4rem" }}>
            {children}
            {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        </label>
    );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
    return <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: 3 }}>{children}</p>;
}

function inputStyle(hasError: boolean): React.CSSProperties {
    return {
        width: "100%",
        padding: "0.6rem 0.85rem",
        border: `1px solid ${hasError ? "#ef4444" : "#d1d5db"}`,
        borderRadius: 8,
        fontSize: "0.9rem",
        fontFamily: "inherit",
        color: "#111",
        background: "#fff",
        boxSizing: "border-box",
        outline: "none",
        appearance: "none",
    };
}
