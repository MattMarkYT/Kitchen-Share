'use client';

import { useMemo, useRef, useState } from 'react';
import { ClientResponseError } from 'pocketbase';
import { MapPin, Tag, X } from 'lucide-react';
import pb from '@/app/lib/pb';
import { CATEGORY_OPTIONS } from '@/app/types/categories';
import type { Listing } from '@/app/types/listing';
import usLocations from '@/app/lib/us-locations.json';

const MAX_PHOTOS = 6;
const MAX_TITLE = 60;
const MAX_DESC = 500;

type EditForm = {
  title: string;
  price: string;
  description: string;
  category: string;
  tags: string;
};

type Errors = {
  title?: string;
  price?: string;
  location?: string;
  images?: string;
  category?: string;
  description?: string;
};

type ImageSlot =
    | { kind: 'existing'; filename: string; url: string }
    | { kind: 'new'; file: File; url: string };

interface EditListingModalProps {
  listing: Listing;
  onClose: () => void;
  onSaved: () => void;
}

const ChevronDown = () => (
    <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
      <label className="mb-2 block text-[13px] font-medium text-[#374151]">
        {children}
        {required && <span className="ml-0.5 text-[#f97316]">*</span>}
      </label>
  );
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[12.5px] text-red-600">{children}</p>;
}

function SectionHeader({ number, title, helper }: { number: number; title: string; helper?: string }) {
  return (
      <div className="flex flex-col items-start">
        <div className="flex flex-row items-center gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#075e36] text-xs font-bold text-white shadow-sm">
            {number}
          </div>
          <h2 className="text-[15px] font-semibold leading-5 text-[#111827]">{title}</h2>
        </div>
        {helper ? <p className="ml-9 mt-1 text-[13px] leading-5 text-[#6b7280]">{helper}</p> : null}
      </div>
  );
}

const inputClass =
    'h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-[#9ca3af] disabled:cursor-not-allowed';

function inputWrapClass(hasError: boolean, extra = '') {
  return `relative flex h-11 rounded-lg border bg-white transition focus-within:ring-2 focus-within:ring-orange-100 ${
      hasError ? 'border-red-500 focus-within:border-red-500' : 'border-[#e5e7eb] focus-within:border-[#ff6a00]'
  } ${extra}`;
}

export default function EditListingModal({ listing, onClose, onSaved }: EditListingModalProps) {
  const parsedLoc = (() => {
    const loc = listing.location ?? '';
    const lastComma = loc.lastIndexOf(', ');
    return lastComma >= 0
        ? { city: loc.slice(0, lastComma), state: loc.slice(lastComma + 2) }
        : { city: loc, state: '' };
  })();

  const [locationState, setLocationState] = useState(parsedLoc.state);
  const [locationCity, setLocationCity] = useState(parsedLoc.city);

  const availableCities = useMemo(
      () => (locationState ? usLocations.cities[locationState as keyof typeof usLocations.cities] ?? [] : []),
      [locationState],
  );

  const [form, setForm] = useState<EditForm>({
    title: listing.title ?? '',
    price: String(listing.price ?? ''),
    description: listing.description ?? '',
    category: listing.category ?? '',
    tags: listing.tags ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChange =
      (field: keyof EditForm) =>
          (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            setForm(prev => ({ ...prev, [field]: e.target.value }));
            setErrors(prev => ({ ...prev, [field]: undefined }));
          };

  const buildInitialSlots = (): ImageSlot[] => {
    const slots: ImageSlot[] = [];
    if (listing.main_image) {
      slots.push({ kind: 'existing', filename: listing.main_image, url: pb.files.getURL(listing, listing.main_image) });
    }
    const extras: string[] = Array.isArray(listing.images) ? listing.images : [];
    for (const filename of extras) {
      slots.push({ kind: 'existing', filename, url: pb.files.getURL(listing, filename) });
    }
    return slots;
  };

  const [slots, setSlots] = useState<ImageSlot[]>(buildInitialSlots);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const toAdd = files.slice(0, MAX_PHOTOS - slots.length);
    setSlots(prev => [...prev, ...toAdd.map(file => ({ kind: 'new' as const, file, url: URL.createObjectURL(file) }))]);
    setErrors(prev => ({ ...prev, images: undefined }));
    e.target.value = '';
  };

  const handleRemoveSlot = (index: number) => setSlots(prev => prev.filter((_, i) => i !== index));

  function validate(): boolean {
    const newErrors: Errors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) newErrors.price = 'Valid price is required';
    if (!locationCity.trim()) newErrors.location = 'Location is required';
    if (!form.category.trim()) newErrors.category = 'Category is required';
    if (form.description.length < 5) newErrors.description = 'Description must be at least 5 characters long';
    if (slots.length === 0) newErrors.images = 'Please upload at least one photo';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      data.append('price', String(Number(form.price)));
      data.append('location', locationCity && locationState ? `${locationCity}, ${locationState}` : locationCity || locationState);
      data.append('description', form.description.trim());
      data.append('category', form.category);
      data.append('tags', form.tags.trim());

      const mainSlot = slots[0];
      if (mainSlot?.kind === 'new') data.append('main_image', mainSlot.file);

      const originalExtras: string[] = Array.isArray(listing.images) ? listing.images : [];
      const keptExtras = slots
          .slice(1)
          .filter((s): s is Extract<ImageSlot, { kind: 'existing' }> => s.kind === 'existing')
          .map(s => s.filename);
      for (const f of originalExtras.filter(f => !keptExtras.includes(f))) data.append('images-', f);
      for (const s of slots.slice(1).filter((s): s is Extract<ImageSlot, { kind: 'new' }> => s.kind === 'new')) {
        data.append('images+', s.file);
      }

      const allKept = slots
          .filter((s): s is Extract<ImageSlot, { kind: 'existing' }> => s.kind === 'existing')
          .map(s => s.filename);
      if (listing.main_image && !allKept.includes(listing.main_image) && mainSlot?.kind !== 'new') {
        data.append('main_image-', listing.main_image);
      }

      await pb.collection('listings').update(listing.id, data);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      if (err instanceof ClientResponseError && err.response?.data) {
        const responseErrors: Errors = {};
        const submitMessages: string[] = [];

        Object.entries(err.response.data).forEach(([field, value]) => {
          const message = (value as { message?: string })?.message ?? String(value);
          if (field in form || field === 'main_image' || field === 'images' || field === 'location') {
            if (field === 'main_image' || field === 'images') {
              responseErrors.images = message;
            } else if (field === 'location') {
              responseErrors.location = message;
            } else {
              responseErrors[field as keyof Errors] = message;
            }
          } else {
            submitMessages.push(`${field}: ${message}`);
          }
        });

        setErrors(prev => ({ ...prev, ...responseErrors }));
        setSubmitError(submitMessages.length ? submitMessages.join(' ') : null);
      } else {
        setSubmitError('Failed to save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const photoGridItems = () =>
      Array.from({ length: MAX_PHOTOS }).map((_, index) => {
        const slot = slots[index];
        const isAddSlot = index === slots.length && slots.length < MAX_PHOTOS;

        if (slot) {
          return (
              <div key={`${slot.kind}-${index}-${slot.url}`} className="relative h-[88px] overflow-hidden rounded-lg bg-[#f3f4f6] lg:h-[92px]">
                <img src={slot.url} alt={`Food photo ${index + 1}`} className="h-full w-full object-cover" />
                {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-[#111827]/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                Main
              </span>
                )}
                <button
                    type="button"
                    onClick={() => handleRemoveSlot(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#111827]/75 text-white shadow-sm transition hover:bg-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
          );
        }

        if (isAddSlot) {
          return (
              <button
                  key="add-photos"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-[88px] flex-col items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-white text-center transition hover:border-[#ff6a00] hover:bg-orange-50/30 lg:h-[92px]"
              >
                <svg className="mb-2 text-[#6b7280]" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[13px] font-medium text-[#6b7280]">Add photos</span>
                <span className="mt-1 text-[11.5px] text-[#9ca3af]">Upload up to 6 photos</span>
              </button>
          );
        }

        return (
            <div key={`empty-${index}`} className="flex h-[88px] items-center justify-center rounded-lg bg-[#f3f4f6] lg:h-[92px]">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24" className="text-[#9ca3af]">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
        );
      });

  return (
      <div
          onClick={onClose}
          className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/50 p-4 font-sans text-[#111827]"
          style={{ zIndex: 9999 }}
      >
        <div
            onClick={e => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#fafafa] shadow-2xl"
        >
          <div className="flex items-start justify-between border-b border-[#e5e7eb] bg-[#fafafa] px-6 py-5">
            <div>
              <h2 className="text-[24px] font-bold tracking-[-0.02em] text-[#111827]">Edit your listing</h2>
              <p className="mt-1 text-[14px] leading-6 text-[#6b7280]">
                Update your homemade food listing details. Changes will be visible immediately.
              </p>
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close edit listing modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280] transition hover:bg-[#f3f4f6] hover:text-[#111827]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-6 sm:px-6">
            <form className="px-3" onSubmit={e => e.preventDefault()}>
              <section>
                <SectionHeader number={1} title="Add Photos" helper="Show off your delicious food" />
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{photoGridItems()}</div>
                  <p className="mt-3 text-center text-[12.5px] text-[#6b7280]">Good photos help your listing stand out!</p>
                  {errors.images && <ErrMsg>{errors.images}</ErrMsg>}
                </div>
              </section>

              <section className="mt-7">
                <SectionHeader number={2} title="Basic Information" />
                <div className="mt-4 grid gap-x-7 gap-y-4 md:grid-cols-2">
                  <div>
                    <FieldLabel required>Title</FieldLabel>
                    <div className={inputWrapClass(!!errors.title)}>
                      <input
                          type="text"
                          maxLength={MAX_TITLE}
                          placeholder="e.g. Homemade Lasagna"
                          value={form.title}
                          onChange={handleChange('title')}
                          className={inputClass}
                      />
                      <span className="flex items-center pr-3 text-[12px] text-[#9ca3af]">
                      {form.title.length}/{MAX_TITLE}
                    </span>
                    </div>
                    {errors.title && <ErrMsg>{errors.title}</ErrMsg>}
                  </div>

                  <div>
                    <FieldLabel required>Price</FieldLabel>
                    <div className={inputWrapClass(!!errors.price, 'overflow-hidden p-0')}>
                    <span className="flex h-full w-11 items-center justify-center border-r border-[#e5e7eb] bg-[#fafafa] text-sm font-medium text-[#374151]">
                      $
                    </span>
                      <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price}
                          onChange={handleChange('price')}
                          className={inputClass}
                      />
                    </div>
                    {errors.price && <ErrMsg>{errors.price}</ErrMsg>}
                  </div>

                  <div>
                    <FieldLabel required>Location</FieldLabel>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className={inputWrapClass(!!errors.location, 'relative p-0')}>
                        <select
                            value={locationState}
                            onChange={e => {
                              setLocationState(e.target.value);
                              setLocationCity('');
                              setErrors(prev => ({ ...prev, location: undefined }));
                            }}
                            className={`${inputClass} appearance-none pr-9`}
                        >
                          <option value="">Select state</option>
                          {usLocations.states.map((s: { name: string; isoCode: string }) => (
                              <option key={s.isoCode} value={s.isoCode}>
                                {s.name}
                              </option>
                          ))}
                        </select>
                        <ChevronDown />
                      </div>
                      <div className={inputWrapClass(!!errors.location, 'relative p-0')}>
                        <select
                            value={locationCity}
                            onChange={e => {
                              setLocationCity(e.target.value);
                              setErrors(prev => ({ ...prev, location: undefined }));
                            }}
                            disabled={!locationState}
                            className={`${inputClass} appearance-none pr-9`}
                        >
                          <option value="">Select city</option>
                          {availableCities.map((c: string) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                          ))}
                        </select>
                        <ChevronDown />
                      </div>
                    </div>
                    {errors.location && <ErrMsg>{errors.location}</ErrMsg>}
                    <p className="mt-2 flex items-center gap-1 text-[12.5px] leading-4 text-[#6b7280]">
                      <MapPin className="h-3.5 w-3.5" /> Where is your food available for pickup?
                    </p>
                  </div>

                  <div>
                    <FieldLabel required>Category</FieldLabel>
                    <div className={inputWrapClass(!!errors.category, 'relative p-0')}>
                      <select value={form.category} onChange={handleChange('category')} className={`${inputClass} appearance-none pr-10`}>
                        <option value="">Select a category</option>
                        {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                    {errors.category && <ErrMsg>{errors.category}</ErrMsg>}
                    <p className="mt-2 flex items-center gap-1 text-[12.5px] leading-4 text-[#6b7280]">
                      <Tag className="h-3.5 w-3.5" /> What type of food is this?
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-7">
                <SectionHeader number={3} title="Details" />
                <div className="mt-4 grid gap-x-7 gap-y-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <div className="relative">
                    <textarea
                        placeholder="Tell buyers about your food..."
                        maxLength={MAX_DESC}
                        value={form.description}
                        onChange={handleChange('description')}
                        className={`h-24 w-full resize-none rounded-lg border bg-white px-3 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:ring-2 focus:ring-orange-100 ${
                            errors.description ? 'border-red-500 focus:border-red-500' : 'border-[#e5e7eb] focus:border-[#ff6a00]'
                        }`}
                    />
                      <span className="absolute bottom-2 right-3 text-[12px] text-[#9ca3af]">
                      {form.description.length}/{MAX_DESC}
                    </span>
                    </div>
                    {errors.description && <ErrMsg>{errors.description}</ErrMsg>}
                  </div>

                  <div>
                    <FieldLabel>
                      Tags <span className="font-normal text-[#9ca3af]">(optional)</span>
                    </FieldLabel>
                    <div className={inputWrapClass(false)}>
                      <input type="text" placeholder="Add tags..." value={form.tags} onChange={handleChange('tags')} className={inputClass} />
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[12.5px] leading-4 text-[#6b7280]">
                      <Tag className="h-3.5 w-3.5" /> Add keywords to help buyers find your listing
                    </p>
                  </div>
                </div>
              </section>

              {submitError && <ErrMsg>{submitError}</ErrMsg>}

              <div className="mt-6 border-t border-[#e5e7eb] pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                      type="button"
                      onClick={onClose}
                      className="h-10 rounded-lg border border-[#e5e7eb] bg-white px-6 text-[13px] font-semibold text-[#374151] shadow-sm transition hover:bg-[#f3f4f6]"
                  >
                    Cancel
                  </button>
                  <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className={`h-10 rounded-lg px-6 text-[13px] font-semibold text-white shadow-sm transition ${
                          saving ? 'cursor-not-allowed bg-[#d1d5db]' : 'bg-[#ff6a00] hover:bg-[#f06000]'
                      }`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
