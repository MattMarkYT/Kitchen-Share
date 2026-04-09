import {Listing} from "@/app/home/page";
import pb from "@/app/lib/pb";
import Link from "next/link";
import {MapPin} from "lucide-react";
import React from "react";

export function ListingCard({ listing }: { listing: Listing }) {
    const imgUrl =
        pb.files.getURL(listing, listing.main_image as string, { thumb: "640x480" }) ||
        "/placeholder.jpg";

    return (
        <li className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link href={`/listing/${listing.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                    <img
                        src={imgUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                </div>

                <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="line-clamp-1 text-lg font-semibold text-stone-900">
                                {listing.title || "Unknown"}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
                                <MapPin className="h-4 w-4" />
                                <span className="line-clamp-1">
                                    {listing.location || "Neighborhood unavailable"}
                                </span>
                            </div>
                        </div>

                        <div className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                            ${listing.price.toLocaleString()}
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
}