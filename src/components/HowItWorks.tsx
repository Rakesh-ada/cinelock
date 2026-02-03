"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Terminal, Film, FileJson, Search, Image as ImageIcon, PieChart } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
    {
        icon: <Search className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Deep Research",
        description: "AI analyzes film databases and production notes to gather authentic references, styles, and technical details for your project.",
    },
    {
        icon: <ImageIcon className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Cinematic Visualization",
        description: "Generate high-fidelity frames based on your research. Visualize characters, environments, and lighting with precision.",
    },
    {
        icon: <PieChart className="w-6 h-6 md:w-7 md:h-7 text-cinelock-accent" />,
        title: "Budget Prediction",
        description: "Our AI breaks down your visualized scenes to estimate production costs, providing detailed line-item budgets instantly.",
    },
];

export default function HowItWorks() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Set initial state to visible, then animate
            gsap.set(".step-card", { opacity: 1, y: 0 });

            gsap.fromTo(".step-card",
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
                    stagger: 0.15,
                    ease: "power2.out",
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="how-it-works" ref={containerRef} className="py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-10 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 md:mb-14">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 md:mb-6">How It Works</h2>
                    <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base">
                        From idea to consistent sequence in three simple steps.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="step-card bg-[#013a63] border border-white/10 p-6 md:p-8 rounded-xl hover:border-cinelock-accent/40 transition-all duration-300 group shadow-lg"
                        >
                            <div className="bg-cinelock-blue w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                                {step.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
