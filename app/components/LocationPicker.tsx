"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ChevronDown, Search, X } from "lucide-react";
import usLocations from "@/app/lib/us-locations.json";

const usStates = usLocations.states;

interface LocationPickerProps {
    city: string;
    state: string;
    onLocationChange: (city: string, state: string) => void;
}

export default function LocationPicker({ city, state, onLocationChange }: LocationPickerProps) {
    const [open, setOpen] = useState(false);
    const [selectedState, setSelectedState] = useState(state);
    const [citySearch, setCitySearch] = useState("");
    const [step, setStep] = useState<"state" | "city">("state");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSelectedState(state);
    }, [state]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setStep("state");
                setCitySearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const cities = selectedState
        ? (usLocations.cities[selectedState as keyof typeof usLocations.cities] ?? [])
        : [];
    const filteredCities = citySearch
        ? cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
        : cities;

    function handleStateSelect(abbr: string) {
        setSelectedState(abbr);
        setCitySearch("");
        setStep("city");
    }

    function handleCitySelect(cityName: string) {
        onLocationChange(cityName, selectedState);
        setOpen(false);
        setStep("state");
        setCitySearch("");
    }

    const displayText = city && state ? `${city}, ${state}` : "Select location";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setOpen(!open);
                    setStep("state");
                    setCitySearch("");
                }}
                className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-400 hover:shadow"
            >
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>{displayText}</span>
                <ChevronDown className="h-4 w-4 text-stone-400" />
            </button>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-stone-200 bg-white shadow-xl">
                    {/* header */}
                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                        <span className="text-sm font-semibold text-stone-800">
                            {step === "state" ? "Select State" : `Cities in ${selectedState}`}
                        </span>
                        {step === "city" && (
                            <button
                                onClick={() => {
                                    setStep("state");
                                    setCitySearch("");
                                }}
                                className="text-xs text-orange-500 hover:text-orange-600"
                            >
                                Back
                            </button>
                        )}
                    </div>

                    {/* search (city step only) */}
                    {step === "city" && (
                        <div className="relative border-b border-stone-100 px-3 py-2">
                            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Search city…"
                                value={citySearch}
                                onChange={(e) => setCitySearch(e.target.value)}
                                className="w-full rounded-lg border border-stone-200 py-1.5 pl-8 pr-8 text-sm outline-none focus:border-orange-400"
                                autoFocus
                            />
                            {citySearch && (
                                <button
                                    onClick={() => setCitySearch("")}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* list */}
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {step === "state" &&
                            usStates.map((s) => (
                                <li key={s.isoCode}>
                                    <button
                                        onClick={() => handleStateSelect(s.isoCode)}
                                        className={`w-full px-4 py-2 text-left text-sm transition hover:bg-orange-50 ${
                                            s.isoCode === selectedState
                                                ? "font-semibold text-orange-600"
                                                : "text-stone-700"
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                </li>
                            ))}

                        {step === "city" &&
                            filteredCities.map((c) => (
                                <li key={c}>
                                    <button
                                        onClick={() => handleCitySelect(c)}
                                        className={`w-full px-4 py-2 text-left text-sm transition hover:bg-orange-50 ${
                                            c === city && selectedState === state
                                                ? "font-semibold text-orange-600"
                                                : "text-stone-700"
                                        }`}
                                    >
                                        {c}
                                    </button>
                                </li>
                            ))}

                        {step === "city" && filteredCities.length === 0 && (
                            <li className="px-4 py-3 text-center text-sm text-stone-400">
                                No cities found
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
