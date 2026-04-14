"use client";

import type { pbuser } from "@/app/types/pbuser";
import pb from "@/app/lib/pb";
import Link from "next/link";
import { MapPin } from "lucide-react";

export function UserCard({ user }: { user: pbuser }) {
    const avatarUrl = pb.files.getURL(user, user.avatar, { thumb: "200x200" }) ||
                            "/placeholder-avatar.jpg";

    const location = [user.city, user.state].filter(Boolean).join(", ");

    return (
        <li className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <Link href={`/profile/${user.id}`} className="block">
                <div className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="relative h-24 w-24 overflow-hidden rounded-full bg-stone-100">
                        <img
                            src={avatarUrl}
                            alt={user.displayName || "User avatar"}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-stone-900">
                            {user.displayName || "Unknown User"}
                        </h3>

                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                            <MapPin className="h-4 w-4" />
                            <span>{location || "Location unavailable"}</span>
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
}