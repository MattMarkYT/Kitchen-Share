"use client";

import { useEffect, useRef, useState } from "react";
import {usePathname, useRouter} from "next/navigation";
import Link from "next/link";
import pb from "../lib/pb";
import { useCurrentUser } from "../hooks";
import SearchBar from "@/app/components/SearchBar";
import {ChevronDown, User, LogOut, Heart, Map, Info, Plus, MessageCircle} from "lucide-react";
import PillButton from "@/app/components/PillButton";
import {setAuthRedirect} from "@/app/api/authRedirect";
import IconButton from "@/app/components/IconButton";
import {useIsMobile} from "@/app/hooks/useIsMobile";

type UserRecord = {
    id: string;
    displayName?: string;
    avatar?: string;
    email?: string;
};

export default function Navbar() {
    const router = useRouter();
    const currentUserId = useCurrentUser();
    const isMobile = useIsMobile();

    const [user, setUser] = useState<UserRecord | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [searchOpen, setSearchOpen] = useState(false);

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

    const logo = (
        <div className="flex flex-col leading-none">
            <span className="text-xs font-medium uppercase tracking-[0.28em] text-amber-700">
                Neighborhood Food
            </span>
            <span className="text-2xl font-bold tracking-tight text-stone-900">
                Neighborhood Eats
            </span>
        </div>);
    const logoMobile = (
        <div className="text-2xl font-bold text-stone-900">
            N
        </div>);

    return (
        <header className={`${isMobile ? "fixed w-full bottom-0" : "sticky top-0"} z-50 border-b border-t border-stone-300 bg-white/90 backdrop-blur-md`}>
            {!isMobile ?
                <nav className="mx-auto xl:max-w-5/6 flex flex-wrap items-center justify-between w-full gap-4 px-5 py-4 md:px-8">
                    <Link
                        href="/"
                        className="shrink-0 transition-opacity hover:opacity-80"
                    >
                        {logo}
                    </Link>
                    <div className="order-3 w-full sm:order-2 sm:w-auto sm:flex-1 sm:flex sm:justify-center">
                        <SearchBar />
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-6 px-4 text-xs order-last font-medium text-stone-600 sm:order-3">
                        <IconButton href="/about" label={"About"}>
                            <Info className={"text-stone-600"} />
                        </IconButton>
                        <IconButton href="/map" label={"Map"}>
                            <Map className={"text-stone-600"}/>
                        </IconButton>
                        {currentUserId &&
                            <IconButton href="/favorites" label={"Favorites"}>
                                <Heart className={"text-red-400"} />
                            </IconButton>
                        }
                        {currentUserId ? (
                            <>
                                <IconButton href={`/createlisting`} label={"Create Listing"}>
                                    <Plus className={"text-stone-600"} />
                                </IconButton>
                                <IconButton href={`/messages`} label={"Messages"}>
                                    <MessageCircle className={"text-stone-600"} />
                                </IconButton>
                                <div className="relative" ref={menuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen((prev) => !prev)}
                                        className="rounded-full border border-stone-300 bg-white font-medium text-stone-800 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-50"
                                    >
                                        <div className="h-10 w-10 overflow-hidden rounded-full bg-stone-100">
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
                                <Link onClick={setAuthRedirect} href={`/auth`}>
                                    <PillButton>
                                        Log in
                                    </PillButton>
                                </Link>
                            </>
                        )}
                    </div>

                </nav>
                :
                <nav className="mx-auto flex flex-wrap">
                    <div className="w-full flex justify-center py-3 mx-4">
                        <SearchBar/>
                    </div>
                    <div className="w-full flex flex-wrap items-center justify-between border-t border-stone-300 gap-4 px-5 py-4 md:px-8">
                        <Link
                            href="/"
                            className="shrink-0 transition-opacity hover:opacity-80"
                        >
                            {logoMobile}
                        </Link>
                        <IconButton href="/about" label={"About"}>
                            <Info className={"text-stone-600"} />
                        </IconButton>
                        <IconButton href="/map" label={"Map"}>
                            <Map className={"text-stone-600"}/>
                        </IconButton>
                        {currentUserId &&
                            <IconButton href="/favorites" label={"Favorites"}>
                                <Heart className={"text-red-400"} />
                            </IconButton>
                        }
                        {currentUserId ? (
                            <>
                                <IconButton href={`/createlisting`} label={"Create Listing"}>
                                    <Plus className={"text-stone-600"} />
                                </IconButton>
                                <IconButton href={`/messages`} label={"Messages"}>
                                    <MessageCircle className={"text-stone-600"} />
                                </IconButton>
                                <div className="relative" ref={menuRef}>
                                    {menuOpen && (
                                    <div className="absolute right-0 bottom-18 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
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
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen((prev) => !prev)}
                                        className="rounded-full border border-stone-300 bg-white font-medium text-stone-800 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-50"
                                    >
                                        <div className="h-10 w-10 overflow-hidden rounded-full bg-stone-100">
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
                                    </button>


                                </div>
                            </>
                        ) : (
                            <>
                                <Link onClick={setAuthRedirect} href={`/auth`}>
                                    <PillButton>
                                        Log in
                                    </PillButton>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            }

        </header>
    );
}