"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import pb from "@/app/lib/pb";

type LocationContextType = {
    city: string;
    state: string;
    locationReady: boolean;
    setCity: (city: string) => void;
    setState: (state: string) => void;
    setLocation: (city: string, state: string) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [locationReady, setLocationReady] = useState(false);
    const userOverrideRef = useRef(false);
    const loadedForRef = useRef<string | null>(null);

    const loadFromProfile = React.useCallback(async (userId: string) => {
        if (loadedForRef.current === userId) return;
        try {
            const user = await pb.collection("users").getOne(userId);
            loadedForRef.current = userId; // mark only on success
            if (user.city && user.state && !userOverrideRef.current) {
                setCity(user.city);
                setState(user.state);
            }
        } catch {
            // fetch failed — leave loadedForRef unset so a retry is possible
        }
        setLocationReady(true);
    }, []);

    useEffect(() => {
        // Initial load — async IIFE so setState only fires after await
        void (async () => {
            const initial = pb.authStore.record;
            if (initial?.id) {
                await loadFromProfile(initial.id);
            } else {
                setLocationReady(true);
            }
        })();

        const unsub = pb.authStore.onChange(() => {
            const record = pb.authStore.record;
            const newId = record?.id ?? null;
            const prevId = loadedForRef.current;

            if (newId === prevId) return; // token refresh, same user — ignore

            if (!newId) {
                loadedForRef.current = null;
                userOverrideRef.current = false;
                setCity("");
                setState("");
                setLocationReady(true);
            } else {
                userOverrideRef.current = false;
                loadFromProfile(newId);
            }
        });

        return () => unsub();
    }, [loadFromProfile]);

    const setLocation = (newCity: string, newState: string) => {
        userOverrideRef.current = true;
        setCity(newCity);
        setState(newState);
    };

    return (
        <LocationContext.Provider value={{ city, state, locationReady, setCity, setState, setLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
};
