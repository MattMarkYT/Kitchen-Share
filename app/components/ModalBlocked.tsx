"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X,
    UserX,
    ShieldCheck,
    MoreHorizontal,
    Undo2,
    Eye,
    Flag,
} from "lucide-react";
import pb from "@/app/lib/pb";
import Link from "next/link";

type PocketBaseUser = {
    id: string;
    collectionId: string;
    collectionName: string;
    displayName?: string;
    name?: string;
    username?: string;
    avatar?: string;
};

type BlockRecord = {
    id: string;
    blocker: string;
    blockedUser: string;
    created: string;
    updated: string;
    expand?: {
        blockedUser?: PocketBaseUser;
    };
};

type BlockedUsersModalProps = {
    open: boolean;
    onClose: () => void;
    currentUserId: string;
};

export default function BlockedUsersModal({
                                              open,
                                              onClose,
                                              currentUserId,
                                          }: BlockedUsersModalProps) {
    const [mounted, setMounted] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<BlockRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open || !currentUserId) return;

        async function fetchBlockedUsers() {
            try {
                setLoading(true);

                const records = await pb.collection("blocks").getFullList<BlockRecord>({
                    filter: pb.filter('blocker = {:blocker}', { blocker: currentUserId }),
                    sort: "-created",
                    expand: "blockedUser",
                });

                setBlockedUsers(records);
            } catch (error) {
                console.error("Failed to fetch blocked users:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchBlockedUsers();
    }, [open, currentUserId]);

    useEffect(() => {
        if (!open) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [open]);

    async function handleUnblock(blockId: string) {
        try {
            await pb.collection("blocks").delete(blockId);
            setBlockedUsers((prev) => prev.filter((block) => block.id !== blockId));
        } catch (error) {
            console.error("Failed to unblock user:", error);
        }
    }

    function getAvatarUrl(user?: PocketBaseUser) {
        if (!user?.avatar) return null;
        return pb.files.getUrl(user, user.avatar);
    }

    function getDisplayName(user?: PocketBaseUser) {
        return user?.displayName || user?.name || user?.username || "Unknown user";
    }

    function formatBlockedDate(date: string) {
        const createdDate = new Date(date);
        const now = new Date();

        const diffMs = now.getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Blocked today";
        if (diffDays === 1) return "Blocked yesterday";
        if (diffDays < 7) return `Blocked ${diffDays} days ago`;

        return `Blocked ${createdDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        })}`;
    }

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[1px]">
            <div
                className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-neutral-100 px-8 py-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                            <UserX size={22} />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-neutral-950">
                                Blocked Users
                            </h2>

                            <p className="mt-1 text-sm text-neutral-500">
                                Blocked users can’t message you or interact with your listings.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-50"
                        aria-label="Close blocked users modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-visible px-8 py-4">
                    {loading && (
                        <div className="flex min-h-[240px] items-center justify-center">
                            <div className="text-sm text-neutral-500">
                                Loading blocked users...
                            </div>
                        </div>
                    )}

                    {!loading && blockedUsers.length === 0 && (
                        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                                <UserX size={42} />
                            </div>

                            <h3 className="mt-5 text-lg font-black text-neutral-950">
                                You haven’t blocked anyone yet
                            </h3>

                            <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                                When you block a user, they’ll appear here so you can manage
                                them later.
                            </p>
                        </div>
                    )}

                    {!loading &&
                        blockedUsers.map((block) => {
                            const user = block.expand?.blockedUser;
                            const avatarUrl = getAvatarUrl(user);

                            return (
                                <div
                                    key={block.id}
                                    className="relative flex items-center justify-between border-b border-neutral-100 py-5 last:border-b-0"
                                >
                                    <Link
                                        href={`/profile/${user?.id}`}
                                        onClick={onClose}
                                        className="flex min-w-0 items-center gap-4 hover:opacity-75 transition-opacity"
                                    >
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt={getDisplayName(user)}
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                                                <UserX size={22} />
                                            </div>
                                        )}

                                        <div className="min-w-0">
                                            <h3 className="truncate font-bold text-neutral-950">
                                                {getDisplayName(user)}
                                            </h3>

                                            <p className="mt-1 text-sm text-neutral-500">
                                                {formatBlockedDate(block.created)}
                                            </p>
                                        </div>
                                    </Link>


                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleUnblock(block.id)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-orange-500 px-5 py-2.5 text-sm font-bold text-orange-500 transition hover:bg-orange-50"
                                        >
                                            <Undo2 size={16} />
                                            Unblock
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-neutral-100 px-8 py-5">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <ShieldCheck size={17} className="text-neutral-500" />
                        Blocking helps keep our community safe and friendly.
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}