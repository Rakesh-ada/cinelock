"use client";

import React from "react";
import {
    Settings,
    LogOut,
    PanelLeftClose,
    Plus,
    Trash2
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    sessions?: any[];
    currentSessionId?: string | null;
    onNewChat?: () => void;
    onSwitchChat?: (id: string) => void;
    onDeleteChat?: (id: string, e: React.MouseEvent) => void;
}

export function AppSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    sessions = [],
    currentSessionId,
    onNewChat,
    onSwitchChat,
    onDeleteChat
}: AppSidebarProps) {
    const pathname = usePathname();
    const { user } = useUser();

    const handleNewChat = () => {
        if (onNewChat) {
            onNewChat();
        } else {
            window.location.href = '/chat';
        }
    };

    const switchChat = (sessionId: string) => {
        if (onSwitchChat) {
            onSwitchChat(sessionId);
        } else {
            window.location.href = `/chat?id=${sessionId}`;
        }
    };

    const deleteChat = (sessionId: string, e: React.MouseEvent) => {
        if (onDeleteChat) {
            onDeleteChat(sessionId, e);
        }
    };

    return (
        <>
            {/* SVG Gradient Definition */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="icon-3d-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
                        <stop offset="100%" stopColor="#fefce8" /> {/* Cream White */}
                    </linearGradient>
                </defs>
            </svg>

            <aside className={cn(
                "flex-shrink-0 flex flex-col bg-[#0b1221]/80 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden border-cream-white/5",
                isSidebarOpen ? "w-[280px] border-r pt-0 px-4 pb-4 translate-x-0 opacity-100" : "w-0 p-0 border-none -translate-x-10 opacity-0"
            )}>
                {/* User Profile / Workspace Switcher */}
                <div className="flex items-center gap-3 px-3 h-14 mb-4 group min-w-[240px] hover:bg-cream-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-cream-white/5 mt-2">
                    <img
                        src={user?.imageUrl || "/user-avatar.png"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-cream-white/10 group-hover:border-cinelock-accent/50 transition-colors"
                    />
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="text-sm font-medium text-cream-white group-hover:text-cinelock-accent transition-colors truncate tracking-wide">{user?.fullName || user?.username || "User"}</h3>
                        <p className="text-xs text-blue-200/70 truncate group-hover:text-blue-200 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-gray-500 hover:text-cream-white transition-colors p-1 rounded-md hover:bg-cream-white/10"
                        title="Close Sidebar"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Navigation */}
                <nav className="space-y-1 mb-2 min-w-[240px]">
                    <Link href="/chat">
                        <button className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group border",
                            pathname === "/chat" || pathname === "/"
                                ? "bg-cream-white/10 text-cream-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border-cream-white/10"
                                : "text-gray-400 border-transparent hover:bg-cream-white/5 hover:text-cream-white hover:border-cream-white/5"
                        )}>
                            <div className="flex items-center gap-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4.5 h-4.5"
                                    style={pathname === "/chat" || pathname === "/" ? { fill: "url(#icon-3d-gradient)" } : undefined}
                                >
                                    <path d="M20.5624 10.1875C20.8124 9.5 20.8749 8.8125 20.8124 8.125C20.7499 7.4375 20.4999 6.75 20.1874 6.125C19.6249 5.1875 18.8124 4.4375 17.8749 4C16.8749 3.5625 15.8124 3.4375 14.7499 3.6875C14.2499 3.1875 13.6874 2.75 13.0624 2.4375C12.4374 2.125 11.6874 2 10.9999 2C9.9374 2 8.8749 2.3125 7.9999 2.9375C7.1249 3.5625 6.4999 4.4375 6.1874 5.4375C5.4374 5.625 4.8124 5.9375 4.1874 6.3125C3.6249 6.75 3.1874 7.3125 2.8124 7.875C2.24991 8.8125 2.06241 9.875 2.18741 10.9375C2.31241 12 2.7499 13 3.4374 13.8125C3.1874 14.5 3.1249 15.1875 3.1874 15.875C3.2499 16.5625 3.4999 17.25 3.8124 17.875C4.3749 18.8125 5.1874 19.5625 6.1249 20C7.1249 20.4375 8.1874 20.5625 9.2499 20.3125C9.7499 20.8125 10.3124 21.25 10.9374 21.5625C11.5624 21.875 12.3124 22 12.9999 22C14.0624 22 15.1249 21.6875 15.9999 21.0625C16.8749 20.4375 17.4999 19.5625 17.8124 18.5625C18.4999 18.4375 19.1874 18.125 19.7499 17.6875C20.3124 17.25 20.8124 16.75 21.1249 16.125C21.6874 15.1875 21.8749 14.125 21.7499 13.0625C21.6249 12 21.2499 11 20.5624 10.1875ZM13.0624 20.6875C12.0624 20.6875 11.3124 20.375 10.6249 19.8125C10.6249 19.8125 10.6874 19.75 10.7499 19.75L14.7499 17.4375C14.8749 17.375 14.9374 17.3125 14.9999 17.1875C15.0624 17.0625 15.0624 17 15.0624 16.875V11.25L16.7499 12.25V16.875C16.8124 19.0625 15.0624 20.6875 13.0624 20.6875ZM4.9999 17.25C4.5624 16.5 4.3749 15.625 4.5624 14.75C4.5624 14.75 4.6249 14.8125 4.6874 14.8125L8.6874 17.125C8.8124 17.1875 8.8749 17.1875 8.9999 17.1875C9.1249 17.1875 9.2499 17.1875 9.3124 17.125L14.1874 14.3125V16.25L10.1249 18.625C9.2499 19.125 8.2499 19.25 7.3124 19C6.3124 18.75 5.4999 18.125 4.9999 17.25ZM3.9374 8.5625C4.3749 7.8125 5.0624 7.25 5.8749 6.9375V7.0625V11.6875C5.8749 11.8125 5.8749 11.9375 5.9374 12C5.9999 12.125 6.0624 12.1875 6.1874 12.25L11.0624 15.0625L9.3749 16.0625L5.3749 13.75C4.4999 13.25 3.8749 12.4375 3.6249 11.5C3.3749 10.5625 3.4374 9.4375 3.9374 8.5625ZM17.7499 11.75L12.8749 8.9375L14.5624 7.9375L18.5624 10.25C19.1874 10.625 19.6874 11.125 19.9999 11.75C20.3124 12.375 20.4999 13.0625 20.4374 13.8125C20.3749 14.5 20.1249 15.1875 19.6874 15.75C19.2499 16.3125 18.6874 16.75 17.9999 17V12.25C17.9999 12.125 17.9999 12 17.9374 11.9375C17.9374 11.9375 17.8749 11.8125 17.7499 11.75ZM19.4374 9.25C19.4374 9.25 19.3749 9.1875 19.3124 9.1875L15.3124 6.875C15.1874 6.8125 15.1249 6.8125 14.9999 6.8125C14.8749 6.8125 14.7499 6.8125 14.6874 6.875L9.8124 9.6875V7.75L13.8749 5.375C14.4999 5 15.1874 4.875 15.9374 4.875C16.6249 4.875 17.3124 5.125 17.9374 5.5625C18.4999 6 18.9999 6.5625 19.2499 7.1875C19.4999 7.8125 19.5624 8.5625 19.4374 9.25ZM8.9374 12.75L7.2499 11.75V7.0625C7.2499 6.375 7.4374 5.625 7.8124 5.0625C8.1874 4.4375 8.7499 4 9.3749 3.6875C9.9999 3.375 10.7499 3.25 11.4374 3.375C12.1249 3.4375 12.8124 3.75 13.3749 4.1875C13.3749 4.1875 13.3124 4.25 13.2499 4.25L9.2499 6.5625C9.1249 6.625 9.0624 6.6875 8.9999 6.8125C8.9374 6.9375 8.9374 7 8.9374 7.125V12.75ZM9.8124 10.75L11.9999 9.5L14.1874 10.75V13.25L11.9999 14.5L9.8124 13.25V10.75Z" />
                                </svg>
                                <span className="text-sm font-medium tracking-wide">Cinelock AI</span>
                            </div>
                        </button>
                    </Link>

                    <Link href="/scenes">
                        <button className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group border",
                            pathname === "/scenes"
                                ? "bg-cream-white/10 text-cream-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border-cream-white/10"
                                : "text-gray-400 border-transparent hover:bg-cream-white/5 hover:text-cream-white hover:border-cream-white/5"
                        )}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4.5 h-4.5"
                                style={pathname === "/scenes" ? { fill: "url(#icon-3d-gradient)" } : undefined}
                            >
                                <path d="M20.4668 8.69379L20.7134 8.12811C21.1529 7.11947 21.9445 6.31641 22.9323 5.87708L23.6919 5.53922C24.1027 5.35653 24.1027 4.75881 23.6919 4.57612L22.9748 4.25714C21.9616 3.80651 21.1558 2.97373 20.7238 1.93083L20.4706 1.31953C20.2942 0.893489 19.7058 0.893489 19.5293 1.31953L19.2761 1.93083C18.8442 2.97373 18.0384 3.80651 17.0252 4.25714L16.308 4.57612C15.8973 4.75881 15.8973 5.35653 16.308 5.53922L17.0677 5.87708C18.0555 6.31641 18.8471 7.11947 19.2866 8.12811L19.5331 8.69379C19.7136 9.10792 20.2864 9.10792 20.4668 8.69379ZM14.3075 3H14.3414C14.1203 3.62556 14 4.29873 14 5C14 5.70127 14.1203 6.37444 14.3414 7H11.9981L14.3075 3ZM20 11V19H4V6.46076L5.99807 3H2.9918C2.45531 3 2 3.44476 2 3.9934V20.0066C2 20.5551 2.44405 21 2.9918 21H21.0082C21.5447 21 22 20.5552 22 20.0066V11H20ZM8.30747 3L5.99807 7H9.68867L11.9981 3H8.30747Z" />
                            </svg>
                            <span className="text-sm font-medium tracking-wide">Scenes</span>
                        </button>
                    </Link>

                    <Link href="/budget">
                        <button className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group border",
                            pathname === "/budget"
                                ? "bg-cream-white/10 text-cream-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border-cream-white/10"
                                : "text-gray-400 border-transparent hover:bg-cream-white/5 hover:text-cream-white hover:border-cream-white/5"
                        )}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4.5 h-4.5"
                                style={pathname === "/budget" ? { fill: "url(#icon-3d-gradient)" } : undefined}
                            >
                                <path d="M20.0049 6.99979V4.99979H4.00488V18.9998H20.0049V16.9998H12.0049C11.4526 16.9998 11.0049 16.5521 11.0049 15.9998V7.99979C11.0049 7.4475 11.4526 6.99979 12.0049 6.99979H20.0049ZM3.00488 2.99979H21.0049C21.5572 2.99979 22.0049 3.4475 22.0049 3.99979V19.9998C22.0049 20.5521 21.5572 20.9998 21.0049 20.9998H3.00488C2.4526 20.9998 2.00488 20.5521 2.00488 19.9998V3.99979C2.00488 3.4475 2.4526 2.99979 3.00488 2.99979ZM13.0049 8.99979V14.9998H20.0049V8.99979H13.0049ZM15.0049 10.9998H18.0049V12.9998H15.0049V10.9998Z" />
                            </svg>
                            <span className="text-sm font-medium tracking-wide">Budget</span>
                        </button>
                    </Link>
                </nav>

                {/* Spacer & Chat History */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 py-4">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recents</span>
                        <button
                            onClick={handleNewChat}
                            className="p-1 text-gray-400 hover:text-cream-white hover:bg-cream-white/5 rounded transition-colors"
                            title="New Chat"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-0.5">
                        {sessions.sort((a, b) => b.updatedAt - a.updatedAt).map((session) => (
                            <div
                                key={session.id}
                                className="relative group"
                            >
                                <button
                                    onClick={() => switchChat(session.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 pr-10 rounded-lg text-sm transition-colors truncate",
                                        currentSessionId === session.id
                                            ? "text-cream-white bg-cream-white/10"
                                            : "text-gray-400 hover:text-cream-white hover:bg-cream-white/5"
                                    )}
                                >
                                    {session.title || "New Chat"}
                                </button>
                                <button
                                    onClick={(e) => deleteChat(session.id, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10 rounded"
                                    title="Delete conversation"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-cream-white/5 space-y-2 min-w-[240px]">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-cream-white/5 hover:text-cream-white transition-colors">
                        <Settings className="w-4.5 h-4.5" />
                        <span className="text-sm font-medium">Settings</span>
                    </button>
                    <Link href="/">
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                            <LogOut className="w-4.5 h-4.5" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </Link>
                    <div className="pt-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl border border-cream-white/5 relative overflow-hidden group cursor-pointer">
                            <div className="absolute inset-0 bg-cinelock-accent/5 group-hover:bg-cinelock-accent/10 transition-colors"></div>
                            <h4 className="text-sm font-medium text-cream-white mb-1 relative z-10">Cinelock Pro</h4>
                            <p className="text-xs text-gray-400 mb-3 relative z-10 leading-relaxed">
                                Unlock unlimited generations and higher resolution.
                            </p>
                            <button className="w-full bg-cream-white text-black text-xs font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors relative z-10">
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
