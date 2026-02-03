"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    magneticStrength?: number;
    showPlayOnHover?: boolean;
    children: React.ReactNode;
}

export function MagneticButton({
    className,
    variant = "primary",
    size = "md",
    magneticStrength = 0.15,
    showPlayOnHover = false,
    children,
    ...props
}: MagneticButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = (e.clientX - centerX) * magneticStrength;
        const distanceY = (e.clientY - centerY) * magneticStrength;

        setPosition({ x: distanceX, y: distanceY });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const variants = {
        primary: "bg-cream-white text-black hover:bg-white/10 hover:text-cream-white hover:backdrop-blur-md border border-transparent hover:border-white/30 shadow-lg shadow-cream-white/10",
        secondary: "bg-cinelock-gray text-cream-white border border-cinelock-gray hover:bg-white/10 hover:backdrop-blur-md hover:border-white/30",
        outline: "bg-transparent text-cream-white border border-cream-white/20 hover:border-cream-white/40 hover:bg-white/10 hover:backdrop-blur-md",
    };

    const sizes = {
        sm: "px-5 py-2.5 text-sm",
        md: "px-7 py-3.5 text-base",
        lg: "px-10 py-5 text-lg",
    };

    return (
        <button
            ref={buttonRef}
            className={cn(
                "relative rounded-full font-medium transition-all duration-300 ease-out",
                "active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                "hover:shadow-xl hover:shadow-cinelock-accent/8",
                "group overflow-hidden",
                variants[variant],
                sizes[size],
                className
            )}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: position.x === 0 && position.y === 0
                    ? "transform 0.5s cubic-bezier(0.33, 1, 0.68, 1)"
                    : "transform 0.1s ease-out",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {/* Glow effect on hover */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cinelock-accent/0 via-cinelock-accent/5 to-cinelock-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {showPlayOnHover ? (
                    <>
                        <span className="group-hover:opacity-0 group-hover:-translate-x-4 transition-all duration-300">
                            {children}
                        </span>
                        <svg
                            className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </>
                ) : (
                    children
                )}
            </span>
        </button>
    );
}
