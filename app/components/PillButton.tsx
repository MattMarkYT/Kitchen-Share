"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface props extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

export default function PillButton({ children, className = "", ...props }: props) {
    return (
        <button
            {...props}
            className={`px-6 py-2 border-2 border-blue-700 text-blue-700 font-semibold text-base rounded-full transition-all duration-200 ease-in-out hover:bg-blue-700/10 ${className}`}
        >
            {children}
        </button>
    );
}
