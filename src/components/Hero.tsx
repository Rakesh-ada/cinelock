"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { MagneticButton } from "./ui/MagneticButton";

export default function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            // Text reveal
            tl.from(".hero-text-line", {
                y: 100,
                opacity: 0,
                duration: 1.5,
                stagger: 0.2,
                ease: "power4.out",
            })
                .from(".hero-sub", {
                    y: 20,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.out",
                }, "-=1")
                .from(".hero-btn", {
                    y: 20,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power2.out",
                }, "-=0.5");

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative min-h-[100svh] flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            {/* Glow overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-cinelock-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
                <h1 ref={textRef} className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05] mb-6 md:mb-8">
                    <div className="overflow-hidden"><span className="hero-text-line block">Film Research.</span></div>
                    <div className="overflow-hidden"><span className="hero-text-line block text-gradient-cinematic pb-1">Visuals & Budget.</span></div>
                </h1>

                <p className="hero-sub text-base sm:text-lg md:text-xl text-gray-400 max-w-xl lg:max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-2">
                    Cinelock streamlines your pre-production. Generate cinematic visuals, perform deep film research, and get AI-predicted budgets instantly.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                    <MagneticButton size="lg" className="hero-btn w-full sm:w-auto min-w-[180px]">
                        Start Creating
                    </MagneticButton>
                    <MagneticButton variant="outline" size="lg" className="hero-btn w-full sm:w-auto min-w-[180px]" showPlayOnHover>
                        See How It Works
                    </MagneticButton>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 13l5 5 5-5" />
                    <path d="M7 6l5 5 5-5" />
                </svg>
            </div>
        </section>
    );
}
