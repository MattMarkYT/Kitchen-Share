"use client";

import { useEffect, useRef, useState } from "react";
import {usePathname, useRouter} from "next/navigation";
import Link from "next/link";
import pb from "../lib/pb";
import { useCurrentUser } from "../hooks";
import SearchBar from "@/app/components/SearchBar";
import { ChevronDown, User, LogOut } from "lucide-react";
import PillButton from "@/app/components/PillButton";

type UserRecord = {
    id: string;
    displayName?: string;
    avatar?: string;
    email?: string;
};

export default function Navbar() {
    const router = useRouter();
    const currentUserId = useCurrentUser();
    const currentPath = usePathname();

    const [user, setUser] = useState<UserRecord | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        pb.realtime.unsubscribeByPrefix('');
        pb.authStore.clear();
        setMenuOpen(false);
        router.refresh();
    };

    useEffect(() => {
        const fetchUser = async () => {
            if (!currentUserId) {
                setUser(null);
                return;
            }

            try {
                const record = await pb.collection("users").getOne<UserRecord>(currentUserId);
                setUser(record);
            } catch (error) {
                console.error("Failed to fetch user:", error);
                setUser(null);
            }
        };

        fetchUser();
    }, [currentUserId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const avatarUrl =
        user?.avatar
            ? pb.files.getURL(user as any, user.avatar)
            : null;

    return (
        <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-md">
            <nav className="mx-auto flex max-w-5/6 items-center gap-4 px-5 py-4 md:px-8">
                <Link
                    href="/"
                    className="shrink-0 transition-opacity hover:opacity-80"
                >
                    <div className="flex flex-col leading-none">
                        <span className="text-xs font-medium uppercase tracking-[0.28em] text-amber-700">
                            Neighborhood Food
                        </span>
                        <span className="text-2xl font-bold tracking-tight text-stone-900">
                            Neighborhood Eats
                        </span>
                    </div>
                </Link>

                <div className="hidden lg:flex items-center gap-6 ml-8 text-sm font-medium text-stone-600">
                    <Link href="/" className="transition-colors hover:text-stone-900">
                        Discover
                    </Link>
                    <Link href="/map" className="transition-colors hover:text-stone-900">
                        Map
                    </Link>
                    {currentUserId &&
                        <Link href="/favorites" className="transition-colors hover:text-stone-900">
                            Favorites
                        </Link>
                    }
                </div>

                <div className="mx-auto hidden w-full max-w-xl md:block">
                        <SearchBar />
                </div>

                <div className="ml-auto flex items-center gap-2 md:gap-3">
                    {currentUserId ? (
                        <>
                            <Link href={`/createlisting`}>
                                <PillButton>Create</PillButton>
                            </Link>
                            <Link href={`/messages`}>
                                <PillButton>Messages</PillButton>
                            </Link>
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-2 py-2 pr-3 text-sm font-medium text-stone-800 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-50"
                                >
                                    <div className="h-9 w-9 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={user?.displayName || "User avatar"}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-stone-500">
                                                <User className="h-4 w-4" />
                                            </div>
                                        )}
                                    </div>

                                    <span className="hidden max-w-[140px] truncate sm:block">
                                        {user?.displayName || "My Account"}
                                    </span>

                                    <ChevronDown className="h-4 w-4 text-stone-500" />
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                                        <div className="border-b border-stone-100 px-4 py-3">
                                            <p className="truncate text-sm font-semibold text-stone-900">
                                                {user?.displayName || "My Account"}
                                            </p>
                                            {user?.email && (
                                                <p className="truncate text-xs text-stone-500">
                                                    {user.email}
                                                </p>
                                            )}
                                        </div>

                                        <div className="p-2">
                                            <Link
                                                href={`/profile/${currentUserId}`}
                                                onClick={() => setMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                                            >
                                                <User className="h-4 w-4" />
                                                <span>Profile</span>
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href={`/auth?previous=@${currentPath.slice(1)}`}>
                                <PillButton>
                                    Log in
                                </PillButton>
                            </Link>

                            <Link href={`/auth?previous=!${currentPath.slice(1)}`}>
                                <PillButton>
                                    Join the community
                                </PillButton>
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="mx-auto block max-w-7xl px-5 pb-4 md:hidden">
                <div>
                    <SearchBar />
                </div>
            </div>
        </header>
    );
}