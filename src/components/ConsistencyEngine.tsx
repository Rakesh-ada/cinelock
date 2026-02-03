"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ConsistencyEngine() {
    const containerRef = useRef<HTMLElement>(null);
    const comparisonRef = useRef<HTMLDivElement>(null);
    const [clipPosition, setClipPosition] = useState(0);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate clip position from 0% to 100% based on scroll
            gsap.to({ value: 0 }, {
                value: 100,
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 70%",
                    end: "center center",
                    scrub: 1,
                },
                onUpdate: function () {
                    setClipPosition(this.targets()[0].value);
                },
                ease: "none",
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="consistency" ref={containerRef} className="py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cinelock-teal/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
                <div className="lg:w-1/2 text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 md:mb-6">
                        From Script <br />
                        <span className="text-gradient-cinematic">To Production Budget.</span>
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base lg:text-lg mb-6 leading-relaxed">
                        Don't just visualize your film—plan it. Cinelock analyzes your generated scenes to create
                        detailed cost estimates, helping you pitch and budget with confidence.
                    </p>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4">
                        {["Script Analysis", "Visual Storyboard", "Automated Budgeting"].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 bg-cinelock-gray/30 px-3 py-2 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-cinelock-accent" />
                                <span className="font-medium text-white/90 text-xs md:text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison Container */}
                <div
                    ref={comparisonRef}
                    className="lg:w-1/2 relative w-full max-w-md h-[280px] sm:h-[320px] md:h-[360px] rounded-lg md:rounded-xl overflow-hidden border border-white/10 bg-cinelock-gray shadow-2xl mx-auto"
                >
                    {/* Base Image (Before/Standard AI) - Always visible */}
                    <div className="absolute inset-0">
                        <img
                            src="/images/rose.jpg"
                            alt="Standard AI"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>

                    {/* Overlay Image (After/Cinelock) - Clipped based on scroll */}
                    <div
                        className="absolute inset-0"
                        style={{
                            clipPath: `inset(0 ${100 - clipPosition}% 0 0)`,
                        }}
                    >
                        <img
                            src="/images/Rosely.jpg"
                            alt="Cinelock Engine"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-cinelock-teal/20 via-transparent to-transparent" />
                    </div>

                    {/* Center Divider Line */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-cinelock-accent shadow-[0_0_10px_rgba(0,204,255,0.5)] z-10"
                        style={{ left: `${clipPosition}%`, transform: 'translateX(-50%)' }}
                    />


                </div>
            </div>
        </section>
    );
}
