"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticButton } from "./ui/MagneticButton";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function CallToAction() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".cta-content", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 75%",
                },
                scale: 0.9,
                opacity: 0,
                duration: 1,
                ease: "expo.out",
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="min-h-screen px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
            {/* Extended ambient glow for subtle background presence */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-cinelock-deep-space/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-cinelock-accent/5 rounded-full blur-[100px]" />

            {/* CTA Content - Centered */}
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="cta-content relative z-10 text-center w-full max-w-3xl lg:max-w-4xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight mb-6 md:mb-8 leading-[1.1]">
                        Direct movies <br />
                        <span className="text-gradient-cinematic">With prompt.</span>
                    </h2>
                    <div className="flex justify-center px-4">
                        <MagneticButton size="lg" magneticStrength={0.5} className="min-w-[200px] sm:min-w-[240px]">
                            Start with a Prompt
                        </MagneticButton>
                    </div>
                    <p className="mt-5 md:mt-6 text-gray-500 text-xs sm:text-sm">No credit card required for first 3 scenes.</p>
                </div>
            </div>

            {/* Footer - At Bottom */}
            <footer className="py-8 md:py-10 border-t border-white/5 bg-transparent text-gray-500 text-sm relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-cream-white font-display font-bold text-base md:text-lg mb-1">Cinelock</span>
                        <p className="text-xs md:text-sm">2026 Cinelock AI Inc.</p>
                    </div>

                    <div className="flex gap-6 md:gap-8 text-xs md:text-sm">
                        <Link href="#" className="hover:text-cream-white transition-colors duration-200">Privacy</Link>
                        <Link href="#" className="hover:text-cream-white transition-colors duration-200">Terms</Link>
                        <Link href="#" className="hover:text-cream-white transition-colors duration-200">Twitter</Link>
                    </div>
                </div>
            </footer>
        </section>
    );
}
