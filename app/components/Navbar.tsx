"use client";

import { useRouter } from "next/navigation";
import PillButton from "./PillButton";

export default function Navbar() {
    const router = useRouter();

    return (
        <nav className="flex justify-between items-center py-4 px-8 md:px-12 relative z-10 max-w-7xl mx-auto">
            <span className="text-2xl font-bold text-blue-700 tracking-tight">
                Kitchen Share
            </span>

            <PillButton onClick={() => router.push("/auth")}>
                Log in
            </PillButton>
        </nav>
    );
}
