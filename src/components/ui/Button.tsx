import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
}

export function Button({
    className,
    variant = "primary",
    size = "md",
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-cream-white text-black hover:bg-cinelock-accent hover:text-cream-white border border-transparent",
        secondary: "bg-cinelock-gray text-cream-white border border-cinelock-gray hover:border-cinelock-accent/50 hover:bg-cinelock-gray/80",
        outline: "bg-transparent text-cream-white border border-cream-white/20 hover:border-cream-white hover:bg-cream-white/5",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    return (
        <button
            className={cn(
                "rounded-full font-medium transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}
