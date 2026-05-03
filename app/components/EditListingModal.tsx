'use client';

import { useState, useMemo, useRef } from 'react';
import { X, MapPin, Tag } from 'lucide-react';
import pb from '@/app/lib/pb';
import { CATEGORY_OPTIONS } from '@/app/types/categories';
import type { Listing } from '@/app/types/listing';
import usLocations from '@/app/lib/us-locations.json';

const MAX_PHOTOS = 6;

type EditForm = {
  title: string;
  price: string;
  description: string;
  category: string;
  tags: string;
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
  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

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

  const availableCities = useMemo(() =>
    locationState ? (usLocations.cities[locationState as keyof typeof usLocations.cities] ?? []) : [],
    [locationState]
  );

  const [form, setForm] = useState<EditForm>({
    title: listing.title ?? '',
    price: String(listing.price ?? ''),
    description: listing.description ?? '',
    category: listing.category ?? '',
    tags: listing.tags ?? '',
  });

  const handleChange = (field: keyof EditForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

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
    e.target.value = '';
  };

  const handleRemoveSlot = (index: number) => setSlots(prev => prev.filter((_, i) => i !== index));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) { setError('Valid price is required.'); return; }
    if (slots.length === 0) { setError('At least one photo is required.'); return; }

    setSaving(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      data.append('price', String(Number(form.price)));
      data.append('location', locationCity && locationState ? `${locationCity}, ${locationState}` : (locationCity || locationState));
      data.append('description', form.description.trim());
      data.append('category', form.category);
      data.append('tags', form.tags.trim());

      const mainSlot = slots[0];
      if (mainSlot?.kind === 'new') data.append('main_image', mainSlot.file);

      const originalExtras: string[] = Array.isArray(listing.images) ? listing.images : [];
      const keptExtras = slots.slice(1).filter((s): s is Extract<ImageSlot, { kind: 'existing' }> => s.kind === 'existing').map(s => s.filename);
      for (const f of originalExtras.filter(f => !keptExtras.includes(f))) data.append('images-', f);
      for (const s of slots.slice(1).filter((s): s is Extract<ImageSlot, { kind: 'new' }> => s.kind === 'new')) data.append('images+', s.file);

      const allKept = slots.filter((s): s is Extract<ImageSlot, { kind: 'existing' }> => s.kind === 'existing').map(s => s.filename);
      if (listing.main_image && !allKept.includes(listing.main_image) && mainSlot?.kind !== 'new') {
        data.append('main_image-', listing.main_image);
      }

      await pb.collection('listings').update(listing.id, data);
      onSaved();
      onClose();
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 text-sm text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 transition-all placeholder:text-stone-300';
  const selectClass = inputClass + ' appearance-none cursor-pointer pr-7';

  const SectionBadge = ({ n }: { n: number }) => (
    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </span>
  );

  const SectionHeader = ({ n, title, sub }: { n: number; title: string; sub: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <SectionBadge n={n} />
      <div>
        <p className="text-xs font-bold text-stone-900 leading-tight">{title}</p>
        <p className="text-[10px] text-stone-400 leading-tight">{sub}</p>
      </div>
    </div>
  );

  const photoGridItems = () => {
    const items: React.ReactNode[] = [];

    if (slots.length < MAX_PHOTOS) {
      items.push(
        <button
          key="add"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square rounded-lg border-2 border-dashed border-stone-300 bg-white hover:border-orange-400 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-0.5 text-stone-400 hover:text-orange-500"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-[9px] font-semibold leading-tight">Add photos</span>
          <span className="text-[8px] text-stone-400 leading-tight">Up to {MAX_PHOTOS}</span>
        </button>
      );
    }

    slots.forEach((slot, i) => {
      items.push(
        <div key={`slot-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200">
          <img src={slot.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
          {i === 0 && (
            <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/60 text-white px-1 py-0.5 rounded">
              Main
            </span>
          )}
          <button
            type="button"
            onClick={() => handleRemoveSlot(i)}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      );
    });

    const totalShown = (slots.length < MAX_PHOTOS ? 1 : 0) + slots.length;
    for (let i = 0; i < MAX_PHOTOS - totalShown; i++) {
      items.push(
        <div key={`empty-${i}`} className="aspect-square rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center">
          <svg width="16" height="16" fill="none" stroke="#d1d5db" strokeWidth={1.2} viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      );
    }

    return items;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
      >

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-stone-100">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-orange-500 mb-0.5">Edit Listing</p>
            <h2 className="text-lg font-bold text-stone-900 leading-tight">Edit Listing</h2>
            <p className="text-xs text-stone-400 mt-0.5">Update your listing details. Changes will be visible immediately.</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-stone-200 hover:bg-stone-100 transition-colors text-stone-500 flex-shrink-0 mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body: Photos (left) | Info + Details (right) */}
        <div className="flex">

          {/* Left: Photos */}
          <div className="w-64 flex-shrink-0 border-r border-stone-100 p-4 flex flex-col gap-2">
            <SectionHeader n={1} title="Photos" sub="Update photos for your listing." />
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
            <div className="grid grid-cols-2 gap-1.5">
              {photoGridItems()}
            </div>
            <p className="text-[9px] text-stone-400 flex items-center gap-1 mt-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Good photos help your listing stand out!
            </p>
          </div>

          {/* Right: Basic Info + Details stacked */}
          <div className="flex-1 flex flex-col divide-y divide-stone-100">

            {/* Section 2: Basic Info */}
            <div className="p-4 flex flex-col gap-2.5">
              <SectionHeader n={2} title="Basic Information" sub="Update the basic info about your listing." />

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 flex items-center gap-0.5 mb-1">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className={inputClass + ' pr-10'}
                      value={form.title}
                      onChange={handleChange('title')}
                      placeholder="e.g. Homemade Lasagna"
                      maxLength={60}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-stone-300 pointer-events-none">
                      {form.title.length}/60
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-600 flex items-center gap-0.5 mb-1">
                    Price <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input
                      className={inputClass + ' pl-6'}
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange('price')}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 flex items-center gap-0.5 mb-1">
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-1">
                    <div className="relative flex-1">
                      <select
                        className={selectClass}
                        value={locationState}
                        onChange={e => { setLocationState(e.target.value); setLocationCity(''); }}
                      >
                        <option value="">State</option>
                        {usLocations.states.map((s: { name: string; isoCode: string }) => (
                          <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown />
                    </div>
                    <div className="relative flex-1">
                      <select
                        className={selectClass + ' disabled:opacity-40 disabled:cursor-not-allowed'}
                        value={locationCity}
                        onChange={e => setLocationCity(e.target.value)}
                        disabled={!locationState}
                      >
                        <option value="">City</option>
                        {availableCities.map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                  <p className="text-[9px] text-stone-400 mt-1 flex items-center gap-0.5">
                    <MapPin className="w-2 h-2" /> Where is your food available for pickup?
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-stone-600 flex items-center gap-0.5 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select className={selectClass} value={form.category} onChange={handleChange('category')}>
                      <option value="">Select a category</option>
                      {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown />
                  </div>
                  <p className="text-[9px] text-stone-400 mt-1 flex items-center gap-0.5">
                    <Tag className="w-2 h-2" /> What type of food is this?
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Details */}
            <div className="p-4 flex flex-col gap-2.5">
              <SectionHeader n={3} title="Details" sub="Add more information about your listing." />

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 mb-1 block">Description</label>
                  <div className="relative">
                    <textarea
                      className={inputClass + ' resize-none'}
                      rows={3}
                      maxLength={500}
                      value={form.description}
                      onChange={handleChange('description')}
                      placeholder="Tell buyers about your food..."
                    />
                    <span className="absolute right-2 bottom-2 text-[9px] text-stone-300 pointer-events-none">
                      {form.description.length}/500
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                      Tags <span className="text-stone-400 font-normal">(optional)</span>
                    </label>
                    <input
                      className={inputClass}
                      value={form.tags}
                      onChange={handleChange('tags')}
                      placeholder="e.g. vegan, spicy, gluten-free"
                    />
                    <p className="text-[9px] text-stone-400 mt-1 flex items-center gap-0.5">
                      <Tag className="w-2 h-2" /> Add keywords to help buyers find your listing
                    </p>
                  </div>

                  {error && (
                    <p className="text-[10px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex gap-3 border-t border-stone-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
