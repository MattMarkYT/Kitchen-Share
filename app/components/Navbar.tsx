"use client";

import { useRouter } from "next/navigation";
import PillButton from "./PillButton";
import Link from "next/link";
import pb from "../lib/pb";
import { useCurrentUser } from "../hooks";
import Form from "next/form";
export default function Navbar() {
    const router = useRouter();
    const currentUserId = useCurrentUser();
    const handleLogout = () => {
        pb.realtime.unsubscribeByPrefix('');
        pb.authStore.clear();
        router.push("/");
        router.refresh();
    };

    return (
        <div className="border-b-2 border-foreground shadow-lg">
            <nav className="flex justify-between items-center py-4 px-8 md:px-12 relative z-10 max-w-7xl mx-auto">
                <Link href="/">
                    <span className="text-2xl font-bold text-blue-700 tracking-tight">
                        Neighborhood Eats
                    </span>
                </Link>

                <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-md">
                        <Form action="/search">
                            <input
                                name="query"
                                type="text"
                                placeholder="Search For Food"
                                className="w-full border rounded-full px-5 py-2 shadow-sm outline-none"/>
                        </Form>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {currentUserId ? (
                        <>
                            <Link href={`/profile/${currentUserId}`}>
                                <PillButton>Profile</PillButton>
                            </Link>
                            
                            <Link href={`/messages`}>
                                <PillButton>Messages</PillButton>
                            </Link>

                            <PillButton onClick={handleLogout}>
                                Logout
                            </PillButton>
                        </>
                    ) : (
                        <Link href="/auth">
                            <PillButton>Log in</PillButton>
                        </Link>
                    )}
                </div>
            </nav>
        </div>
    );
}
