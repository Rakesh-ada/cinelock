"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagneticButton } from "./ui/MagneticButton";

export default function Navbar() {
    const router = useRouter();

    return (
        <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 md:py-4 bg-cinelock-dark/80 backdrop-blur-lg border-b border-cream-white/5">
            <Link href="/" className="text-lg sm:text-xl font-display font-medium tracking-tight text-cream-white">
                Cinelock
            </Link>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
                <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-cream-white transition-colors duration-200">How it works</Link>
                <Link href="#consistency" className="text-sm text-gray-400 hover:text-cream-white transition-colors duration-200">Budgeting</Link>
                <Link href="#use-cases" className="text-sm text-gray-400 hover:text-cream-white transition-colors duration-200">Use Cases</Link>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <MagneticButton size="sm" magneticStrength={0.3} onClick={() => router.push('/chat')}>Login</MagneticButton>
            </div>
        </nav>
    );
}
