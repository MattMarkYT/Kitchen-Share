"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | null = null;

    const initializeMap = async () => {
      if (!mapContainerRef.current) return;
      const maplibre = await import("maplibre-gl");

      map = new maplibre.Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [-118.2437, 34.0522], // Centered on Los Angeles
        zoom: 9, // Adjust zoom level as needed
      });

      map.addControl(new maplibre.NavigationControl(), "top-right");
    };

    initializeMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">OpenFreeMap</h1>
        <p className="mt-2 text-sm text-slate-600">
          Rendering the OpenFreeMap Liberty style using MapLibre GL JS.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div ref={mapContainerRef} className="h-[calc(100vh-10rem)] w-full" />
        </div>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-medium text-slate-900">Attribution</p>
          <p>
            OpenFreeMap © OpenMapTiles. Data from OpenStreetMap.
          </p>
        </div>
      </div>
    </main>
  );
}
