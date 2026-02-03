"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export default function JsonPreview() {
    const containerRef = useRef<HTMLElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <section ref={containerRef} className="py-10 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-10 relative">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

                {/* Video Column (Left on desktop) */}
                <div className="lg:w-1/2 w-full max-w-md lg:max-w-none">
                    <div className="aspect-video bg-black rounded-lg md:rounded-xl overflow-hidden shadow-2xl relative border border-white/10 group ring-1 ring-white/5 shadow-cinelock-accent/5">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                            autoPlay
                            loop
                            muted
                            playsInline
                            src="https://cdn.coverr.co/videos/share/c0684f09-d75d-4467-9366-267924d54625/1080p.mp4"
                        >
                            Your browser does not support the video tag.
                        </video>

                        {/* Cinematic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />

                        <button
                            onClick={toggleMute}
                            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-cinelock-accent hover:border-cinelock-accent hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                    </div>
                </div>

                {/* Text Column (Right on desktop) */}
                <div className="lg:w-1/2 text-center lg:text-left">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-5 md:mb-6 leading-tight">
                        Structured Power. <br />
                        <span className="text-gradient-cinematic">Under the Hood.</span>
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base lg:text-lg mb-6 md:mb-8 leading-relaxed font-light">
                        We translate your natural language prompt into a rigorous JSON schema.
                        This schema acts as the <span className="text-white font-medium">"source of truth"</span> for the AI, ensuring that
                        every pixel generated adheres to the defined constraints.
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4">
                        {["JSON Schema", "Developer API", "Pipeline Ready"].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 bg-cinelock-gray/30 px-3 py-2 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-cinelock-accent" />
                                <span className="font-medium text-white/90 text-xs md:text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
