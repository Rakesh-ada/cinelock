"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import {
    PanelLeftOpen,
    Search,
    Image as ImageIcon,
    Maximize2,
    Download,
    X,
} from "lucide-react";
import Link from "next/link";
import { type Asset } from "@/lib/data";
import { getScenes, getSessions, deleteSessionAction } from "@/lib/actions"; // Added imports
import { useRouter } from "next/navigation";



export default function ScenesPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [assets, setAssets] = useState<Asset[]>([]);
    const [fullscreenAsset, setFullscreenAsset] = useState<Asset | null>(null);
    const [sessions, setSessions] = useState<any[]>([]); // For Sidebar
    const router = useRouter();

    // Load Data
    useEffect(() => {
        const load = async () => {
            try {
                const [loadedScenes, loadedSessions] = await Promise.all([
                    getScenes(),
                    getSessions()
                ]);

                // Map Scenes to Assets
                const mappedAssets: Asset[] = loadedScenes.map((s: any) => ({
                    id: s.id,
                    type: 'image',
                    url: s.imageUrl,
                    title: s.description ? (s.description.slice(0, 50) + (s.description.length > 50 ? '...' : '')) : 'Untitled',
                    prompt: s.description || '',
                    date: new Date(s.timestamp),
                    sessionId: 'legacy-or-direct-upload' // Backend scenes might not be linked to a chat session ID explicitly in the current model
                }));
                setAssets(mappedAssets);

                // Map Sessions
                const mappedSessions = loadedSessions.map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    messages: s.messages, // or stripped
                    updatedAt: s.updatedAt,
                }));
                setSessions(mappedSessions);

            } catch (e) {
                console.error("Failed to load scenes data", e);
            }
        };
        load();
    }, []);

    // Sidebar Handlers
    const handleNewChat = () => router.push('/chat');
    const switchChat = (id: string) => router.push(`/chat?id=${id}`);
    const deleteChat = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => prev.filter(s => s.id !== id));
        await deleteSessionAction(id);
    };

    // Filter assets based on search
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.prompt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex h-screen bg-[#020617] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(1,42,74,0.3),rgba(255,255,255,0))] text-blue-100 font-sans selection:bg-cinelock-accent/30 selection:text-cinelock-accent overflow-hidden">
            <AppSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                sessions={sessions}
                onNewChat={handleNewChat}
                onSwitchChat={switchChat}
                onDeleteChat={deleteChat}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-transparent overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-6 z-20">
                    <div className="flex items-center gap-4">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-gray-400 hover:text-cream-white transition-colors"
                            >
                                <PanelLeftOpen className="w-6 h-6" />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-cream-white tracking-tight">Assets Gallery</h1>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-cinelock-accent transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search scenes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#0b1221]/50 border border-cream-white/10 text-gray-200 text-sm rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-cinelock-accent/50 focus:bg-[#0b1221]/80 transition-all"
                        />
                    </div>
                </header>



                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
                    {assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-in fade-in duration-500">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                                <ImageIcon className="w-10 h-10 text-gray-400 opacity-50 stroke-[1.5]" />
                            </div>
                            <h3 className="text-xl font-semibold text-cream-white mb-2">No Assets Created Yet</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-light">
                                Your generated scenes will appear here. Fast-forward your production visualization.
                            </p>
                            <Link href="/chat">
                                <button className="group relative px-8 py-3 bg-gradient-to-b from-[#1a2333] to-[#0b1221] border border-white/10 rounded-xl text-sm font-medium text-cream-white hover:text-white transition-all hover:border-cinelock-accent/50 hover:shadow-[0_0_20px_-5px_rgba(0,102,204,0.3)]">
                                    <span className="relative z-10 flex items-center gap-2">
                                        Start Creating
                                        <svg className="w-4 h-4 text-cinelock-accent group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-cream-white/5 hover:border-cinelock-accent/30 hover:shadow-[0_0_30px_-10px_rgba(0,102,204,0.3)] transition-all duration-500 bg-[#1a1a1a]"
                                >
                                    {/* Image / Thumbnail */}
                                    <img
                                        src={asset.url}
                                        alt={asset.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                        <h3 className="text-cream-white font-semibold text-lg mb-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 truncate">{asset.title}</h3>
                                        <p className="text-gray-500 text-[10px] mb-3">{formatDate(asset.date)}</p>

                                        <div className="flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                                            <button
                                                onClick={() => setFullscreenAsset(asset)}
                                                className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-cream-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                            <a
                                                href={asset.url}
                                                download={`cinelock-${asset.id}.png`}
                                                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-cream-white rounded-lg transition-colors block"
                                                title="Download"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filteredAssets.length === 0 && assets.length > 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                            <p>No assets found matched your search.</p>
                        </div>
                    )}
                </div>

                {/* Fullscreen Viewer - Fixed full viewport overlay */}
                {fullscreenAsset && (
                    <div className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300 flex items-center justify-center p-4">
                        <div className="w-full max-w-[90vw] h-[90vh] bg-[#0b1221] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative ring-1 ring-white/5">

                            {/* Close Button */}
                            <button
                                onClick={() => setFullscreenAsset(null)}
                                className="absolute top-4 right-4 z-[110] p-2 bg-black/60 hover:bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors border border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Left Side: Visual Asset - Maximized Space */}
                            <div className="flex-1 bg-black/80 relative flex items-center justify-center overflow-hidden h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-white/5">
                                <div className="w-full h-full flex items-center justify-center bg-[#050a14]">
                                    {/* Image is contained but maximized to reduce whitespace */}
                                    <img
                                        src={fullscreenAsset.url}
                                        alt={fullscreenAsset.title}
                                        className="w-full h-full object-contain p-2"
                                    />
                                </div>
                            </div>

                            {/* Right Side: Details & Prompt - Fixed width, independent scroll */}
                            <div className="w-full md:w-[400px] shrink-0 flex flex-col bg-[#0b1221] h-auto md:h-full border-l border-white/5">
                                {/* Scrollable Content Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                                    {/* Header */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-cinelock-accent/10 text-cinelock-accent border-cinelock-accent/20">
                                                Image
                                            </span>
                                            <span className="text-xs text-gray-500">{formatDate(fullscreenAsset.date)}</span>
                                        </div>

                                        {/* Title - allow wrapping, no truncation */}
                                        <h2 className="text-2xl md:text-3xl font-bold text-cream-white leading-tight mb-2 tracking-tight text-balance">
                                            {fullscreenAsset.title}
                                        </h2>
                                    </div>

                                    {/* Prompt Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <span className="text-xs font-bold uppercase tracking-widest">PROMPT</span>
                                        </div>
                                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 shadow-inner">
                                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap tracking-wide break-words">
                                                {fullscreenAsset.prompt}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions - Fixed at bottom of right panel */}
                                <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
                                    <a
                                        href={fullscreenAsset.url}
                                        download={`cinelock-${fullscreenAsset.id}.png`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-cream-white text-black rounded-xl font-semibold hover:bg-white transition-all shadow-lg shadow-white/5 hover:shadow-white/10 active:scale-95 group"
                                    >
                                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                        Download Asset
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
