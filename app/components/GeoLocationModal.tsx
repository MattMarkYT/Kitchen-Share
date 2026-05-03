"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MapPin, Navigation, User } from "lucide-react";

const _isMountedSub = () => () => {};
function useIsMounted() {
    return useSyncExternalStore(_isMountedSub, () => true, () => false);
}

interface GeoLocationModalProps {
    open: boolean;
    detectedCity: string;
    detectedState: string;
    profileCity: string;
    profileState: string;
    onUseGeo: () => void;
    onUseProfile: () => void;
    onDismiss: () => void;
}

export default function GeoLocationModal({
    open,
    detectedCity,
    detectedState,
    profileCity,
    profileState,
    onUseGeo,
    onUseProfile,
    onDismiss,
}: GeoLocationModalProps) {
    const mounted = useIsMounted();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => setVisible(true), 10);
            return () => clearTimeout(t);
        }
        const t = setTimeout(() => setVisible(false), 0);
        return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onDismiss]);

    if (!mounted) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-9999 flex items-center justify-center px-4 transition-all duration-300 ${
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onDismiss}
            />

            {/* Card */}
            <div
                className={`relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl transition-all duration-300 ${
                    visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                }`}
            >
                {/* Icon badge */}
                <div className="mb-5 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                        <MapPin className="h-7 w-7 text-orange-500" strokeWidth={2} />
                    </div>
                </div>

                <h2 className="mb-1 text-center text-xl font-bold text-stone-900">
                    Location Detected
                </h2>
                <p className="mb-6 text-center text-sm text-stone-500">
                    We found you near{" "}
                    <span className="font-semibold text-stone-800">
                        {detectedCity}, {detectedState}
                    </span>
                    . Which location would you like to use?
                </p>

                <div className="flex flex-col gap-3">
                    {/* Use current geo */}
                    <button
                        type="button"
                        onClick={onUseGeo}
                        className="group flex w-full items-center gap-3 rounded-2xl border-2 border-orange-500 bg-orange-500 px-5 py-3.5 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:border-orange-600"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                            <Navigation className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                            <span>Use current location</span>
                            <span className="text-xs font-normal text-orange-100">
                                {detectedCity}, {detectedState}
                            </span>
                        </span>
                    </button>

                    {/* Use profile */}
                    <button
                        type="button"
                        onClick={onUseProfile}
                        className="group flex w-full items-center gap-3 rounded-2xl border-2 border-stone-200 bg-white px-5 py-3.5 text-left text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 group-hover:bg-stone-200 transition">
                            <User className="h-4 w-4 text-stone-500" />
                        </span>
                        <span className="flex flex-col">
                            <span>Use profile location</span>
                            <span className="text-xs font-normal text-stone-400">
                                {profileCity}, {profileState}
                            </span>
                        </span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
