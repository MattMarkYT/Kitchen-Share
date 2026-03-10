"use client";

import { useRouter } from "next/navigation";
import PillButton from "./PillButton";
import Link from "next/link";

export default function Navbar() {
    const router = useRouter();

    return (
        <div className="border-b-2 border-foreground shadow-lg">
            <nav className="flex justify-between items-center py-4 px-8 md:px-12 relative z-10 max-w-7xl mx-auto">
                <Link href="/">
                    <span className="text-2xl font-bold text-blue-700 tracking-tight">
                        Neighborhood Eats
                    </span>

                    <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span className="mr-1"> NearbyImage</span>
                        <span> Nearby</span>
                    </div>
                </Link>

                <div className="flex-1 flex justify-center">
                    <div className="w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Search For Food"
                            className="w-full border rounded-full px-5 py-2 shadow-sm outline-none"/>
                    </div>
                </div>

                <Link href="/auth">
                    <PillButton>
                        Log in
                    </PillButton>
                </Link>
            </nav>
        </div>
    );
}
