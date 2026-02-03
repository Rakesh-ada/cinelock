"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import {
    Image as ImageIcon,
    PanelLeftOpen,
    Copy,
    Pencil,
    ArrowUp,
    ChevronRight,
    X,
    Search,
    Paperclip
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { TypewriterContent } from "../../components/TypewriterContent"; // Moved to separate file
import { type Project, UNASSIGNED_PROJECT_ID } from "@/lib/data";
import {
    getSessions as fetchSessions,
    createSessionAction,
    updateSessionAction,
    deleteSessionAction,
    getProjects as fetchProjects,
    getScenes,
    createSceneAction,
    updateSessionProjectAction
} from "@/lib/actions";


// Removed Dynamic3DScene import

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

const MarkdownDisplay = ({ content }: { content: string }) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                    <div className="my-4 rounded-md overflow-hidden bg-[#0d0d0d] border border-cream-white/10">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] text-xs text-gray-400">
                            <span>{match[1]}</span>
                            <button
                                onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                                className="flex items-center gap-1 hover:text-cream-white"
                            >
                                <Copy className="w-3 h-3" /> Copy
                            </button>
                        </div>
                        <SyntaxHighlighter
                            style={vscDarkPlus} // Changed theme
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <code className={cn("bg-cream-white/10 rounded px-1.5 py-0.5 text-sm font-mono text-cinelock-accent", className)} {...props}>
                        {children}
                    </code>
                )
            },
            table({ children }) {
                return (
                    <div className="overflow-x-auto my-4 border border-cream-white/10 rounded-lg">
                        <table className="w-full text-left text-sm border-collapse">
                            {children}
                        </table>
                    </div>
                )
            },
            thead({ children }) {
                return <thead className="bg-cream-white/5 text-gray-200 uppercase text-xs font-semibold">{children}</thead>
            },
            th({ children }) {
                return <th className="px-4 py-3 border-b border-cream-white/10">{children}</th>
            },
            td({ children }) {
                return <td className="px-4 py-3 border-b border-cream-white/5 text-gray-300">{children}</td>
            },
            p({ children }) {
                return <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
            },
            ul({ children }) {
                return <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
            },
            ol({ children }) {
                return <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>
            },
            h1({ children }) { return <h1 className="text-2xl font-bold mb-4 mt-6 text-cream-white">{children}</h1> },
            h2({ children }) { return <h2 className="text-xl font-bold mb-3 mt-5 text-cream-white">{children}</h2> },
            h3({ children }) { return <h3 className="text-lg font-semibold mb-2 mt-4 text-cream-white">{children}</h3> },
            blockquote({ children }) {
                return <blockquote className="border-l-2 border-cinelock-accent pl-4 italic text-gray-400 my-4">{children}</blockquote>
            },
            a({ href, children }) {
                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-cinelock-accent hover:underline">{children}</a>
            }
        }}
    >
        {content}
    </ReactMarkdown>
);

// TypewriterContent component moved to "@/components/TypewriterContent"

interface Attachment {
    name: string;
    content: string;
    size: number;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    type?: 'text' | 'image' | 'panorama'; // Removed '3d_model'
    imageUrl?: string;
    panoramaUrl?: string;
    enhancedPrompt?: string;
    // Removed modelUrl?: string;
    // Removed sceneConfig?: any;
    attachments?: Attachment[];
}

interface SceneBudget {
    id: string;
    imageUrl: string;
    description: string;
    budgetContent: string;
    projectId: string; // New field
    timestamp: Date;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number; // For sorting
    projectId?: string;
}

function ChatContent() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState<'chat' | 'budget'>('chat');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [isImageMode, setIsImageMode] = useState(false);
    // Removed isPanoramaMode
    // Removed is3DMode
    // Removed fullscreenPanoramaUrl state
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [placeholder, setPlaceholder] = useState("Message Cinelock AI...");
    const [sceneBudgets, setSceneBudgets] = useState<SceneBudget[]>([]);

    // Load Scenes on mount
    useEffect(() => {
        const loadScenes = async () => {
            try {
                const loaded = await getScenes();
                const mapped = loaded.map((s: any) => ({
                    id: s.id,
                    imageUrl: s.imageUrl,
                    description: s.description,
                    budgetContent: s.budgetContent || '',
                    projectId: s.projectId || 'unassigned',
                    timestamp: new Date(s.timestamp)
                }));
                setSceneBudgets(mapped);
            } catch (e) {
                console.error("Failed to load scenes", e);
            }
        };
        loadScenes();
    }, []);

    const formatMessageTimestamp = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const isToday = messageDate.getDate() === now.getDate() && messageDate.getMonth() === now.getMonth() && messageDate.getFullYear() === now.getFullYear();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = messageDate.getDate() === yesterday.getDate() && messageDate.getMonth() === yesterday.getMonth() && messageDate.getFullYear() === yesterday.getFullYear();

        if (isToday) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (isYesterday) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Placeholder logic
    const getPlaceholder = () => {
        if (isImageMode) return "Describe the scene to generate...";
        return "Describe a scene, ask for a budget, or start a story...";
    };

    useEffect(() => {
        setPlaceholder(getPlaceholder());
    }, [isImageMode]);


    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm Cinelock AI, your creative assistant for story development, screenplay writing, and movie production. I can help you brainstorm ideas, develop characters, write scenes, and manage your project budget. How can I assist you today?",
            type: 'text',
            timestamp: new Date()
        }
    ]);



    const searchParams = useSearchParams();
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string>(UNASSIGNED_PROJECT_ID);

    // Safe Storage Logic Removed

    // Load Sessions on Mount
    useEffect(() => {
        const load = async () => {
            try {
                const [loadedSessions, loadedProjects] = await Promise.all([
                    fetchSessions(),
                    fetchProjects()
                ]);

                // Handle Dates
                const restored = loadedSessions.map((s: any) => ({
                    ...s,
                    messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
                }));

                setSessions(restored);
                setProjects(loadedProjects as any);

                const urlId = searchParams.get('id');
                if (urlId) {
                    const matchedSession = restored.find((s: ChatSession) => s.id === urlId);
                    if (matchedSession) {
                        setCurrentSessionId(urlId);
                        setMessages(matchedSession.messages);
                        setCurrentProjectId(matchedSession.projectId || UNASSIGNED_PROJECT_ID);
                    }
                } else if (!currentSessionId && restored.length > 0) {
                    // Default to most recent or new
                    // If we want to mirror old logic of 'New Conversation', we check if exists
                    // But strictly, we can just pick the first one
                    setCurrentSessionId(restored[0].id);
                    setMessages(restored[0].messages);
                    setCurrentProjectId(restored[0].projectId || UNASSIGNED_PROJECT_ID);
                } else if (!currentSessionId && restored.length === 0) {
                    createNewSession();
                }
            } catch (e) {
                console.error("Failed to load sessions", e);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!currentSessionId) {
            setCurrentProjectId(UNASSIGNED_PROJECT_ID);
            return;
        }
        const session = sessions.find(s => s.id === currentSessionId);
        setCurrentProjectId(session?.projectId || UNASSIGNED_PROJECT_ID);
    }, [currentSessionId, sessions]);

    const createNewSession = async () => {
        // Optimistic
        const newId = crypto.randomUUID();
        const newSession: ChatSession = {
            id: newId,
            title: 'New Conversation',
            messages: [],
            updatedAt: Date.now()
        };

        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newId);
        setMessages([]);
        setCurrentProjectId(UNASSIGNED_PROJECT_ID);
        setPrompt("");

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', newId);
        // Use router.replace to update URL without adding to history stack, 
        // ensuring Next.js is aware of the change.
        router.replace(`?id=${newId}`, { scroll: false });

        // Async save
        await createSessionAction({ id: newId, title: 'New Conversation' });
    };

    const handleProjectChange = async (projectId: string) => {
        if (!currentSessionId) return;
        setCurrentProjectId(projectId);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, projectId, updatedAt: Date.now() } : s));
        await updateSessionProjectAction(currentSessionId, projectId);
    };

    // Save Sessions whenever Messages change (Debounced or immediate?)
    // In strict React, we should save exactly when we update messages.
    // But keeping the useEffect pattern for now to catch all message updates
    useEffect(() => {
        if (!currentSessionId) return;
        if (messages.length === 0) return; // Don't save empty if not needed, but createSession handles creation

        // We only need to sync the current session's messages to DB
        // Find if changed?
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (!currentSession) return;

        // Simple equality check to avoid loops? 
        // Or just fire-and-forget update
        // We need to update local sessions state first to reflect changes in UI sidebar

        // Auto-title logic
        let title = currentSession.title;
        if (title === 'New Conversation' && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
            }
        }

        if (currentSession.messages !== messages || currentSession.title !== title) {
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    return { ...s, messages, title, updatedAt: Date.now() };
                }
                return s;
            }));

            updateSessionAction(currentSessionId, { messages, title });
        }
    }, [messages, currentSessionId]);

    const handleNewChat = () => {
        // Check if we already have an empty "New Conversation" to avoid duplicates
        const emptySession = sessions.find(s => s.messages.length === 0 && s.title === 'New Conversation');
        if (emptySession) {
            switchChat(emptySession.id);
        } else {
            createNewSession();
        }
    };

    const switchChat = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setCurrentSessionId(sessionId);
            setMessages(session.messages);

            // router.replace to avoid history stack buildup for simple switching
            router.replace(`?id=${sessionId}`, { scroll: false });
        }
    };

    const deleteChat = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        // Async delete
        deleteSessionAction(sessionId);

        // If deleting current session, switch to another or create new
        if (currentSessionId === sessionId) {
            if (updatedSessions.length > 0) {
                switchChat(updatedSessions[0].id);
            } else {
                createNewSession();
            }
        }
    };


    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);



    const handleDownloadImage = (imageUrl: string, timestamp: Date) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `cinelock-gen-${timestamp.getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ESC key to close fullscreen panorama
    // Removed fullscreenPanoramaUrl state, so this useEffect is no longer needed.
    // useEffect(() => {
    //     const handleEsc = (e: KeyboardEvent) => {
    //         if (e.key === 'Escape' && fullscreenPanoramaUrl) {
    //             setFullscreenPanoramaUrl(null);
    //         }
    //     };
    //     window.addEventListener('keydown', handleEsc);
    //     return () => window.removeEventListener('keydown', handleEsc);
    // }, [fullscreenPanoramaUrl]);

    // Auto-resize edit textarea
    useEffect(() => {
        if (editingMessageId) {
            const textarea = document.getElementById(`edit-input-${editingMessageId}`) as HTMLTextAreaElement;
            if (textarea) {
                textarea.style.height = 'auto'; // Reset
                textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
            }
        }
    }, [editingMessageId]);

    const handleEditMessage = async (msgId: string, newContent: string) => {
        setEditingMessageId(null);

        // Find index of message to edit
        const msgIndex = messages.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return;

        // Keep messages up to the edited one (exclusive)
        // Then add the new edited version
        const previousMessages = messages.slice(0, msgIndex);

        // We need to re-generate response for this new prompt
        // So we effectively restart the conversation from this point

        const newMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: newContent,
            type: 'text',
            timestamp: new Date()
        };

        const newHistory = [...previousMessages, newMessage];
        setMessages(newHistory);
        setIsGenerating(true);
        setIsTyping(true);

        try {
            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are Cinelock AI, a professional assistant specializing in screenplay writing, story development, character creation, movie production knowledge, and budgeting. Help users with creative writing, plot development, character arcs, dialogue, scene descriptions, industry knowledge, and production planning. Be detailed, creative, and professional. KEEP RESPONSES CONCISE. When generating stories or scenes, aim for 400-500 words unless explicitly asked for a long form. Quality over quantity. If you generated a screenplay, scene, or story concept, ask: 'Do you want to create a budget for this?' If you just generated a budget or are chatting casually, do NOT ask this. If asked to create a budget, produce a detailed budget in a markdown table format. Ensure the table is valid Markdown with correct spacing and NEWLINES after every row. Do not output the table as a single line of text." },
                        ...newHistory.map(m => ({ role: m.role, content: m.content }))
                    ]
                })
            });

            if (!chatRes.ok) throw new Error("Chat API failed");

            const data = await chatRes.json();

            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.content,
                type: 'text',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);
            setIsTyping(true); // Start typewriter effect for new message

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "I apologize, but I encountered an error regenerating the response.",
                type: 'text',
                timestamp: new Date()
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // 1. Calculate current total size
        const currentSize = attachments.reduce((acc, curr) => acc + curr.size, 0);
        let newSize = 0;
        const validFiles: File[] = [];

        // 2. Validate new files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== 'application/pdf') {
                alert(`File ${file.name} is not a PDF.`);
                continue;
            }
            newSize += file.size;
            validFiles.push(file);
        }

        // 3. Check 5MB Limit (5 * 1024 * 1024 bytes)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (currentSize + newSize > MAX_SIZE) {
            alert("Total file size cannot exceed 5MB. Please remove some files or upload smaller ones.");
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
            return;
        }

        // 4. Upload Files
        // Ideally we show a loading state, but for now let's just upload
        const newAttachments: Attachment[] = [];

        for (const file of validFiles) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch('/api/upload-pdf', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error(`Upload failed for ${file.name}`);

                const data = await res.json();
                newAttachments.push({
                    name: file.name,
                    content: data.text,
                    size: file.size
                });
            } catch (error) {
                console.error(error);
                alert(`Failed to parse ${file.name}`);
            }
        }

        setAttachments(prev => [...prev, ...newAttachments]);

        // Reset input to allow selecting same file again if removed
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleChat = async () => {
        if (!prompt.trim() && attachments.length === 0) return; // Allow sending if no text but has attachments? Usually need prompt. Let's keep logic simple.

        let currentPrompt = prompt;

        // Inject Context from ALL attachments
        if (attachments.length > 0) {
            const contextBlock = attachments.map(att => `[CONTEXT FROM PDF: ${att.name}]\n${att.content}`).join('\n\n');
            currentPrompt = `${contextBlock}\n\n[USER QUERY]\n${prompt}`;
        }

        // Capture attachments for the message before clearing state
        const currentAttachments = [...attachments];

        setPrompt("");
        setAttachments([]); // Clear attachments after sending

        // Reset textarea height
        const textarea = document.getElementById('chat-input') as HTMLTextAreaElement;
        if (textarea) {
            textarea.style.height = '52px'; // Reset to min-height
        }

        setIsGenerating(true);

        // 1. Add User Message
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: prompt, // Keep visual prompt clean
            timestamp: new Date(),
            attachments: currentAttachments.length > 0 ? currentAttachments : undefined
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            if (isImageMode) {
                // Image Generation Flow
                const response = await fetch('/api/image', { // Changed endpoint to /api/image
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: currentPrompt }),
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                const imageForAnalysis = data.imageUrl;
                const genPrompt = data.revisedPrompt || currentPrompt;

                // 1. Add Image Message Immediately
                const assistantMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `Here is your generated image based on: "${genPrompt}"`,
                    type: 'image',
                    imageUrl: imageForAnalysis,
                    enhancedPrompt: genPrompt,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMsg]);
                setIsImageMode(false);

                // 2. Trigger Background Budget Analysis
                if (imageForAnalysis && !imageForAnalysis.startsWith('/')) {
                    const pidForThis = currentProjectId || UNASSIGNED_PROJECT_ID;
                    let projectContext = null;
                    if (pidForThis && pidForThis !== UNASSIGNED_PROJECT_ID) {
                        const project = projects.find((p: any) => p.id === pidForThis);
                        if (project) {
                            projectContext = {
                                name: project.name,
                                description: project.description,
                                genre: project.genre,
                                scale: project.scale,
                                budgetLimit: project.budgetLimit
                            };
                        }
                    }

                    // Non-blocking call
                    fetch('/api/analyze-budget', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrl: imageForAnalysis,
                            projectContext: projectContext
                        }),
                    })
                        .then(res => res.json())
                        .then(async budgetData => {
                            if (budgetData.content) {
                                const newScene: SceneBudget = {
                                    id: assistantMsg.id,
                                    imageUrl: imageForAnalysis,
                                    description: genPrompt,
                                    budgetContent: budgetData.content,
                                    projectId: pidForThis,
                                    timestamp: new Date()
                                };

                                setSceneBudgets(prev => [newScene, ...prev]);

                                // Persist to MongoDB
                                await createSceneAction({
                                    id: newScene.id,
                                    imageUrl: newScene.imageUrl,
                                    description: newScene.description,
                                    budgetContent: newScene.budgetContent,
                                    projectId: newScene.projectId,
                                    sessionId: currentSessionId || undefined // Pass current session ID
                                });
                            }
                        })
                        .catch(e => console.error("Background budget analysis failed", e));
                }

            } else { // Removed is3DMode branch
                // Standard Chat Flow

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: "You are Cinelock AI, a professional assistant specializing in screenplay writing, story development, character creation, movie production knowledge, and budgeting. Help users with creative writing, plot development, character arcs, dialogue, scene descriptions, industry knowledge, and production planning. Be detailed, creative, and professional. KEEP RESPONSES CONCISE. When generating stories or scenes, aim for 400-500 words unless explicitly asked for a long form. Quality over quantity. If you generated a screenplay, scene, or story concept, ask: 'Do you want to create a budget for this?' If you just generated a budget or are chatting casually, do NOT ask this. If asked to create a budget, produce a detailed budget in a markdown table format. Ensure the table is valid Markdown with correct spacing and NEWLINES after every row. Do not output the table as a single line of text." },
                            ...messages.filter(m => m.type !== 'image').map(m => ({ role: m.role, content: m.content || '' })),
                            { role: 'user', content: currentPrompt },
                        ],
                    }),
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();

                // Add assistant message
                setIsTyping(true);
                const assistantMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.content || data.reply || "I'm not sure how to respond to that.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMsg]);
            }

        } catch (error) {
            console.error('Error fetching chat response:', error);
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "I'm having trouble connecting to the neural core. Please try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsGenerating(false);
            // setIsTyping(false); // Keep typing effect running if successful
        }
    };

    return (
        <div className="flex h-screen bg-[#020617] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(1,42,74,0.3),rgba(255,255,255,0))] text-blue-100 font-sans selection:bg-cinelock-accent/30 selection:text-cinelock-accent overflow-hidden">
            <AppSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onNewChat={handleNewChat}
                onSwitchChat={switchChat}
                onDeleteChat={deleteChat}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-transparent">
                {/* Header - Transparent, floating over chat */}
                <header className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-20">
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-gray-400 hover:text-cream-white transition-colors"
                                title="Open Sidebar"
                            >
                                <PanelLeftOpen className="w-6 h-6" />
                            </button>
                        )}
                        <h1 className="text-xl font-semibold tracking-tight text-cream-white drop-shadow-sm">Cinelock AI</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={currentProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                disabled={!currentSessionId}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs text-gray-300 outline-none focus:ring-2 focus:ring-cinelock-accent/50 [&>option]:bg-[#0b1221] [&>option]:text-gray-300 cursor-pointer"
                            >
                                <option value={UNASSIGNED_PROJECT_ID}>Unassigned</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-cream-white/5 rounded-full text-gray-400 hover:text-cream-white transition-colors" title="Search">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-cream-white/5 rounded-full text-gray-400 hover:text-cream-white transition-colors" title="Ghost Mode">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C16.9706 2 21 6.02944 21 11V19C21 19.2652 20.8946 19.5195 20.707 19.707L18.707 21.707C18.37 22.0441 17.8419 22.0964 17.4453 21.832L15 20.2012L12.5547 21.832C12.2188 22.056 11.7812 22.056 11.4453 21.832L9 20.2012L6.55469 21.832C6.15806 22.0964 5.63003 22.0441 5.29297 21.707L3.29297 19.707C3.10543 19.5195 3 19.2652 3 19V11C3 6.02944 7.02944 2 12 2ZM12 4C8.13401 4 5 7.13401 5 11V18.5859L6.12695 19.7129L8.44531 18.168L8.5752 18.0947C8.88867 17.9475 9.26063 17.9719 9.55469 18.168L12 19.7979L14.4453 18.168L14.5752 18.0947C14.8887 17.9475 15.2606 17.9719 15.5547 18.168L17.8721 19.7129L19 18.5859V11C19 7.13401 15.866 4 12 4ZM9.5 8C10.3284 8 11 8.67157 11 9.5C11 10.3284 10.3284 11 9.5 11C8.67157 11 8 10.3284 8 9.5C8 8.67157 8.67157 8 9.5 8ZM14.5 8C15.3284 8 16 8.67157 16 9.5C16 10.3284 15.3284 11 14.5 11C13.6716 11 13 10.3284 13 9.5C13 8.67157 13.6716 8 14.5 8Z"></path></svg>
                        </button>
                    </div>
                </header>

                {/* Chat Area */}
                {activeView === 'chat' ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-16 pb-6 space-y-8">
                                {messages.map((msg, index) => (
                                    <div key={msg.id} className={cn("w-full flex group", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "flex flex-col max-w-[90%] md:max-w-[85%]",
                                            msg.role === 'user' ? "items-end" : "items-start w-full"
                                        )}>
                                            {/* Name - Only show for Assistant */}
                                            {msg.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-lg font-bold text-cream-white/90">
                                                        AI
                                                    </span>
                                                </div>
                                            )}

                                            {/* Attachment Indicators for User */}
                                            {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-1 justify-end px-1">
                                                    {msg.attachments.map((att, i) => (
                                                        <div key={i} className="px-3 py-1 bg-cream-white/10 border border-cream-white/20 rounded-full inline-flex items-center gap-2 text-xs text-cream-white backdrop-blur-md">
                                                            <Paperclip className="w-3 h-3 text-cinelock-accent" />
                                                            <span className="max-w-[150px] truncate">{att.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {editingMessageId === msg.id ? (
                                                <div className="bg-[#2f2f2f] rounded-3xl p-4 w-[800px] max-w-full">
                                                    <textarea
                                                        className="w-full bg-transparent text-cream-white text-[15px] resize-none focus:outline-none min-h-[80px]"
                                                        defaultValue={msg.content}
                                                        id={`edit-input-${msg.id}`}
                                                        onInput={(e) => {
                                                            const target = e.target as HTMLTextAreaElement;
                                                            target.style.height = 'auto';
                                                            target.style.height = `${target.scrollHeight}px`;
                                                        }}
                                                    />
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={() => setEditingMessageId(null)}
                                                            className="px-4 py-2 text-xs text-cream-white bg-[#424242] rounded-full hover:bg-[#525252] transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const newContent = (document.getElementById(`edit-input-${msg.id}`) as HTMLTextAreaElement).value;
                                                                handleEditMessage(msg.id, newContent);
                                                            }}
                                                            className="px-4 py-2 text-xs bg-cream-white text-black rounded-full hover:bg-gray-200 transition-colors"
                                                        >
                                                            Send
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className={cn(
                                                        "relative group/content text-[16px] leading-7",
                                                        msg.role === 'user'
                                                            ? "bg-cream-white/10 backdrop-blur-md border border-cream-white/10 text-cream-white px-5 py-2.5 rounded-2xl"
                                                            : "text-gray-100 w-full" // Transparent for AI
                                                    )}>
                                                        {msg.type === 'image' ? (
                                                            <div className="flex flex-col gap-3 mt-1">
                                                                <div className="text-gray-200 mb-2">
                                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                                </div>
                                                                {msg.imageUrl && (
                                                                    <div className="rounded-xl overflow-hidden border border-cream-white/10 shadow-lg w-fit">
                                                                        <img
                                                                            src={msg.imageUrl}
                                                                            alt="Generated Content"
                                                                            className="w-auto h-auto max-w-full max-h-[512px]"
                                                                            loading="lazy"
                                                                        />

                                                                        <div className="mt-1 pt-2 border-t border-cream-white/10 bg-black/20 backdrop-blur-sm p-3 space-y-1">
                                                                            {/* Inline Actions for Image */}
                                                                            <div className="flex items-center justify-between gap-3 w-full">
                                                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                                                                    {formatMessageTimestamp(msg.timestamp)}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => handleDownloadImage(msg.imageUrl!, msg.timestamp)}
                                                                                    className="p-1 text-gray-500 hover:text-cinelock-accent transition-colors shrink-0"
                                                                                    title="Download Image"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 19H21V21H3V19ZM13 13.1716L19.0711 7.1005L20.4853 8.51472L12 17L3.51472 8.51472L4.92893 7.1005L11 13.1716V2H13V13.1716Z"></path></svg>
                                                                                </button>
                                                                            </div>

                                                                            {msg.enhancedPrompt && (
                                                                                <details className="group w-full">
                                                                                    <summary className="list-none cursor-pointer flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors w-fit">
                                                                                        <span className="font-medium">View Enhanced Prompt</span>
                                                                                        <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                                                                                    </summary>
                                                                                    <div className="mt-2 p-3 bg-cream-white/5 rounded-lg border border-cream-white/5 text-xs text-gray-400 italic leading-relaxed break-words">
                                                                                        {msg.enhancedPrompt}
                                                                                    </div>
                                                                                </details>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            msg.role === 'assistant' && index === messages.length - 1 && isTyping ? (
                                                                <TypewriterContent content={msg.content} onComplete={() => setIsTyping(false)} />
                                                            ) : (
                                                                // Standard Text / Markdown Rendering
                                                                <div className="markdown-content">
                                                                    <MarkdownDisplay content={msg.content} />
                                                                </div>
                                                            )
                                                        )}
                                                    </div>

                                                    {/* Message Actions (Standard Text Only) */}
                                                    {!['image'].includes(msg.type || '') && (
                                                        <div className={cn(
                                                            "mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-full",
                                                            msg.role === 'user' ? "justify-end" : "justify-start"
                                                        )}>
                                                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                                                {formatMessageTimestamp(msg.timestamp)}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => copyToClipboard(msg.content)}
                                                                    className="p-1 text-gray-500 hover:text-cream-white transition-colors"
                                                                    title="Copy text"
                                                                >
                                                                    <Copy className="w-4 h-4" />
                                                                </button>
                                                                {msg.role === 'user' && (
                                                                    <button
                                                                        onClick={() => setEditingMessageId(msg.id)}
                                                                        className="p-1 text-gray-500 hover:text-cream-white transition-colors"
                                                                        title="Edit message"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isGenerating && !isTyping && (
                                    <div className="flex gap-4">
                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full border-2 border-cream-white/10"></div>
                                            <div className="absolute inset-0 rounded-full border-2 border-t-[#F5F5DC] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center backdrop-blur-sm shadow-lg shadow-blue-900/20">
                                                <svg width="0" height="0" className="absolute">
                                                    <defs>
                                                        <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#3b82f6" />
                                                            <stop offset="100%" stopColor="#fefce8" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <svg viewBox="0 0 24 24" fill="url(#loader-gradient)" className="w-5 h-5">
                                                    <path d="M20.5624 10.1875C20.8124 9.5 20.8749 8.8125 20.8124 8.125C20.7499 7.4375 20.4999 6.75 20.1874 6.125C19.6249 5.1875 18.8124 4.4375 17.8749 4C16.8749 3.5625 15.8124 3.4375 14.7499 3.6875C14.2499 3.1875 13.6874 2.75 13.0624 2.4375C12.4374 2.125 11.6874 2 10.9999 2C9.9374 2 8.8749 2.3125 7.9999 2.9375C7.1249 3.5625 6.4999 4.4375 6.1874 5.4375C5.4374 5.625 4.8124 5.9375 4.1874 6.3125C3.6249 6.75 3.1874 7.3125 2.8124 7.875C2.24991 8.8125 2.06241 9.875 2.18741 10.9375C2.31241 12 2.7499 13 3.4374 13.8125C3.1874 14.5 3.1249 15.1875 3.1874 15.875C3.2499 16.5625 3.4999 17.25 3.8124 17.875C4.3749 18.8125 5.1874 19.5625 6.1249 20C7.1249 20.4375 8.1874 20.5625 9.2499 20.3125C9.7499 20.8125 10.3124 21.25 10.9374 21.5625C11.5624 21.875 12.3124 22 12.9999 22C14.0624 22 15.1249 21.6875 15.9999 21.0625C16.8749 20.4375 17.4999 19.5625 17.8124 18.5625C18.4999 18.4375 19.1874 18.125 19.7499 17.6875C20.3124 17.25 20.8124 16.75 21.1249 16.125C21.6874 15.1875 21.8749 14.125 21.7499 13.0625C21.6249 12 21.2499 11 20.5624 10.1875ZM13.0624 20.6875C12.0624 20.6875 11.3124 20.375 10.6249 19.8125C10.6249 19.8125 10.6874 19.75 10.7499 19.75L14.7499 17.4375C14.8749 17.375 14.9374 17.3125 14.9999 17.1875C15.0624 17.0625 15.0624 17 15.0624 16.875V11.25L16.7499 12.25V16.875C16.8124 19.0625 15.0624 20.6875 13.0624 20.6875ZM4.9999 17.25C4.5624 16.5 4.3749 15.625 4.5624 14.75C4.5624 14.75 4.6249 14.8125 4.6874 14.8125L8.6874 17.125C8.8124 17.1875 8.8749 17.1875 8.9999 17.1875C9.1249 17.1875 9.2499 17.1875 9.3124 17.125L14.1874 14.3125V16.25L10.1249 18.625C9.2499 19.125 8.2499 19.25 7.3124 19C6.3124 18.75 5.4999 18.125 4.9999 17.25ZM3.9374 8.5625C4.3749 7.8125 5.0624 7.25 5.8749 6.9375V7.0625V11.6875C5.8749 11.8125 5.8749 11.9375 5.9374 12C5.9999 12.125 6.0624 12.1875 6.1874 12.25L11.0624 15.0625L9.3749 16.0625L5.3749 13.75C4.4999 13.25 3.8749 12.4375 3.6249 11.5C3.3749 10.5625 3.4374 9.4375 3.9374 8.5625ZM17.7499 11.75L12.8749 8.9375L14.5624 7.9375L18.5624 10.25C19.1874 10.625 19.6874 11.125 19.9999 11.75C20.3124 12.375 20.4999 13.0625 20.4374 13.8125C20.3749 14.5 20.1249 15.1875 19.6874 15.75C19.2499 16.3125 18.6874 16.75 17.9999 17V12.25C17.9999 12.125 17.9999 12 17.9374 11.9375C17.9374 11.9375 17.8749 11.8125 17.7499 11.75ZM19.4374 9.25C19.4374 9.25 19.3749 9.1875 19.3124 9.1875L15.3124 6.875C15.1874 6.8125 15.1249 6.8125 14.9999 6.8125C14.8749 6.8125 14.7499 6.8125 14.6874 6.875L9.8124 9.6875V7.75L13.8749 5.375C14.4999 5 15.1874 4.875 15.9374 4.875C16.6249 4.875 17.3124 5.125 17.9374 5.5625C18.4999 6 18.9999 6.5625 19.2499 7.1875C19.4999 7.8125 19.5624 8.5625 19.4374 9.25ZM8.9374 12.75L7.2499 11.75V7.0625C7.2499 6.375 7.4374 5.625 7.8124 5.0625C8.1874 4.4375 8.7499 4 9.3749 3.6875C9.9999 3.375 10.7499 3.25 11.4374 3.375C12.1249 3.4375 12.8124 3.75 13.3749 4.1875C13.3749 4.1875 13.3124 4.25 13.2499 4.25L9.2499 6.5625C9.1249 6.625 9.0624 6.6875 8.9999 6.8125C8.9374 6.9375 8.9374 7 8.9374 7.125V12.75ZM9.8124 10.75L11.9999 9.5L14.1874 10.75V13.25L11.9999 14.5L9.8124 13.25V10.75Z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-transparent z-20">
                            <div className="max-w-3xl mx-auto">
                                {/* Attachment Pill */}
                                {/* Attachment Pills (Multiple) */}
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2 px-1">
                                        {attachments.map((att, index) => (
                                            <div key={index} className="px-3 py-1 bg-cream-white/10 border border-cream-white/20 rounded-full inline-flex items-center gap-2 text-xs text-cream-white backdrop-blur-md">
                                                <Paperclip className="w-3 h-3 text-cinelock-accent" />
                                                <span className="max-w-[150px] truncate" title={att.name}>{att.name}</span>
                                                <button
                                                    onClick={() => removeAttachment(index)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="relative bg-[#0b1221]/50 backdrop-blur-xl border border-cream-white/10 rounded-[26px] p-3 shadow-2xl focus-within:ring-1 focus-within:ring-white/20 transition-all flex items-end gap-3">
                                    <div className="flex items-center pb-2 pl-2 shrink-0">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="application/pdf"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 text-gray-400 hover:text-cream-white hover:bg-cream-white/5 rounded-full transition-colors"
                                            title="Attach PDF"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <textarea
                                        id="chat-input"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleChat();
                                            }
                                        }}
                                        placeholder={placeholder}
                                        className="flex-1 bg-transparent text-cream-white placeholder-gray-400 text-lg pl-2 pr-2 py-3 outline-none resize-none custom-scrollbar min-h-[52px]"
                                        rows={1}
                                        style={{ maxHeight: '200px' }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                                        }}
                                    />
                                    <div className="flex items-center gap-3 pb-2 pr-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                setIsImageMode(!isImageMode);
                                            }}
                                            className={cn(
                                                "p-2 rounded-full transition-all duration-300 relative group/btn",
                                                isImageMode
                                                    ? "text-cinelock-accent bg-cinelock-accent/10"
                                                    : "text-gray-400 hover:text-cream-white hover:bg-cream-white/5"
                                            )}
                                            title="Generate Image"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </button>
                                        {/* Removed 3D button */}
                                        <button
                                            onClick={handleChat}
                                            disabled={!prompt.trim() || isGenerating}
                                            className={cn(
                                                "p-2 rounded-full transition-all",
                                                prompt.trim()
                                                    ? "bg-[radial-gradient(100%_100%_at_0%_0%,#F5F5DC_0%,#A8D4E6_50%,#0066CC_100%)] text-[#012a4a] hover:opacity-90 shadow-lg shadow-blue-900/40"
                                                    : "bg-[#424242] text-gray-500 cursor-not-allowed"
                                            )}
                                        >
                                            <ArrowUp className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-center text-[12px] text-gray-500 mt-2">
                                    AI can make mistakes. Check important info.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Budget View */
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                        <div className="max-w-5xl mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-cream-white">Production Budgets</h2>
                                <div className="bg-[#1d1d20] border border-cream-white/10 px-4 py-2 rounded-lg">
                                    <span className="text-gray-400 text-sm mr-2">Scenes Analyzed:</span>
                                    <span className="text-cinelock-accent font-bold text-lg">
                                        {sceneBudgets.length}
                                    </span>
                                </div>
                            </div>

                            {sceneBudgets.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-cream-white/10 rounded-2xl bg-cream-white/5">
                                    <p className="text-gray-400">No budgets generated yet. Generate an image in the chat to see a budget breakdown.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {sceneBudgets.map((budget, index) => (
                                        <div key={budget.id} className="bg-[#1d1d20] border border-cream-white/5 rounded-2xl overflow-hidden shadow-lg">
                                            {/* Header */}
                                            <div className="p-4 border-b border-cream-white/5 bg-cream-white/5 flex gap-4 items-center">
                                                <div className="w-16 h-16 rounded-md overflow-hidden bg-black/50 shrink-0 border border-cream-white/10">
                                                    <img src={budget.imageUrl} alt="Scene" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h3 className="text-cream-white font-medium line-clamp-1">{budget.description}</h3>
                                                    <p className="text-xs text-gray-500">{new Date(budget.timestamp).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 text-sm text-gray-300">
                                                <MarkdownDisplay content={budget.budgetContent} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main >


        </div >
    );
}

export default function ChatPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#020617] text-cream-white">Loading Cinelock AI...</div>}>
            <ChatContent />
        </React.Suspense>
    );
}

// Subcomponents for Sidebar

function NavItem({ icon: Icon, label, active, badge }: { icon: any, label: string, active?: boolean, badge?: string }) {
    return (
        <button className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group border",
            active
                ? "bg-cream-white/10 text-cream-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border-cream-white/10"
                : "text-gray-400 border-transparent hover:bg-cream-white/5 hover:text-cream-white hover:border-cream-white/5"
        )}>
            <div className="flex items-center gap-3">
                <Icon className={cn("w-4.5 h-4.5", active ? "text-cinelock-accent" : "text-gray-500 group-hover:text-cream-white")} />
                <span className="text-sm font-medium tracking-wide">{label}</span>
            </div>
            {badge && (
                <span className="bg-cinelock-accent/20 text-cinelock-accent border border-cinelock-accent/50 text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {badge}
                </span>
            )}
        </button>
    );
}

function ProjectItem({ color, label }: { color: string, label: string }) {
    return (
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-cream-white/5 hover:text-cream-white transition-colors">
            <span className={cn("w-2.5 h-2.5 rounded-sm", color)}></span>
            <span className="text-sm truncate">{label}</span>
        </button>
    );
}
