import Link from 'next/link';
import React, {JSX, ReactNode} from 'react';
import {Heart} from "lucide-react";

interface NavItemProps {
    href: string;
    children: JSX.Element;
    label: string;
}

export default function IconButton({ href, children, label }: NavItemProps) {
    return (
        <Link href={href} className={"group flex flex-col justify-center items-center"}>
            <div className="h-6 w-6">
                {children}
            </div>
            <span className="absolute mt-12 opacity-0 transition-opacity group-hover:opacity-100">{label}</span>
        </Link>
    )
}