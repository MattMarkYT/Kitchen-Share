"use client";

import { ReactNode, MouseEvent } from "react";

interface props {
    children: ReactNode;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function PillButton({ children, onClick }: props) {
    return (
        <button
            onClick={onClick}
            className="px-6 py-2 border-2 border-blue-700 text-blue-700 font-semibold text-base rounded-full transition-all duration-200 ease-in-out hover:bg-blue-700/10"
        >
            {children}
        </button>
    );
}
