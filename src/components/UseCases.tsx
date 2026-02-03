"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clapperboard, MapPin, Calculator, Presentation } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const cases = [
    {
        icon: <Clapperboard className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Visual Development",
        desc: "Rapidly iterate on mood and style. Lock the look of your film before pre-production begins.",
    },
    {
        icon: <MapPin className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Virtual Scouting",
        desc: "Generate detailed location concepts and environments to guide your physical scouting.",
    },
    {
        icon: <Calculator className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Rapid Budgeting",
        desc: "Instantly cost out scenes. Get a rough order of magnitude budget from your visual concepts.",
    },
    {
        icon: <Presentation className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Pitch Decks",
        desc: "Arm your pitch with cinematic visuals and data-backed financial projections that investors trust.",
    }
];

export default function UseCases() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Set initial state to visible
            gsap.set(".use-case-card", { opacity: 1, y: 0 });

            gsap.fromTo(".use-case-card",
                { y: 30, opacity: 0.3 },
                {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 85%",
                        toggleActions: "play none none none",
                    },
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "power2.out",
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="use-cases" ref={containerRef} className="py-20 md:py-28 lg:py-32 px-4 sm:px-6 lg:px-10 relative">
            {/* Expanded ambient glow to illuminate all cards evenly */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[600px] md:h-[800px] bg-cinelock-teal/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-10 md:mb-14 text-center">Built for Creators</h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                    {cases.map((c, i) => (
                        <div key={i} className="use-case-card bg-[#013a63] border border-white/10 p-5 md:p-6 lg:p-7 rounded-xl hover:border-cinelock-accent/40 transition-all duration-300 group shadow-lg">
                            <div className="bg-cinelock-blue w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                                {c.icon}
                            </div>
                            <h3 className="text-base md:text-lg font-bold mb-2">{c.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-xs md:text-sm">{c.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
