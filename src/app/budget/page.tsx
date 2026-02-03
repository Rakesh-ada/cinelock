"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import {
    CreditCard,
    PieChart,
    PanelLeftOpen,
    AlertCircle,
    Plus,
    Edit2,
    Check,
    X,
    Trash2,
    ChevronDown,
} from "lucide-react";
import {
    type BudgetItem,
    type ChatSession,
    type Project,
    UNASSIGNED_PROJECT_ID,
} from "@/lib/data";
import {
    getProjects as fetchProjects,
    getSessions as fetchSessions,
    getBudgetItemsAction,
    createProjectAction,
    addBudgetItemAction,
    addBudgetItemsBulkAction,
    updateBudgetItemAction,
    deleteBudgetItemAction,
    updateSessionMessages,
    deleteSessionAction,
    deleteProjectAction
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { STUDIO_BUDGET_SYSTEM_PROMPT } from "@/lib/prompts";

export default function BudgetPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const selectedProjectIdRef = useRef<string>('all');
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [expenses, setExpenses] = useState<BudgetItem[]>([]);

    const [productionScale, setProductionScale] = useState<'indie' | 'standard' | 'studio'>('standard');
    const [isAutoBudgetRunning, setIsAutoBudgetRunning] = useState(false);
    const [autoBudgetError, setAutoBudgetError] = useState<string | null>(null);
    const router = useRouter();

    const handleNewChat = () => {
        router.push('/chat');
    };

    const switchChat = (id: string) => {
        router.push(`/chat?id=${id}`);
    };

    const deleteChat = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => prev.filter(s => s.id !== id));
        await deleteSessionAction(id);
    };

    const isFinalizeSceneCommand = (text: string): boolean => {
        const normalized = text.trim().toLowerCase();
        return normalized === 'finalize scene' || normalized === '/finalize scene' || normalized === 'finalize' || normalized === '/finalize';
    };

    const hasBudgetTable = (content: string): boolean => {
        return content.includes('|') && content.toLowerCase().includes('| item') && content.includes('---');
    };

    const extractScenePromptForFinalize = (session: ChatSession, finalizeIndex: number): string | null => {
        for (let i = finalizeIndex - 1; i >= 0; i--) {
            const m = session.messages[i];
            if (m.role !== 'user') continue;
            if (!m.content) continue;
            if (isFinalizeSceneCommand(m.content)) continue;
            const trimmed = m.content.trim();
            if (trimmed.length < 10) continue;
            return trimmed;
        }
        return null;
    };

    const ensureBudgetTableFormat = (raw: string): string => {
        const content = raw.trim();
        if (hasBudgetTable(content)) return content;

        const lines = content.split('\n');
        const tableStart = lines.findIndex(l => l.trim().startsWith('|') && l.toLowerCase().includes('item'));
        if (tableStart >= 0) {
            const sliced = lines.slice(tableStart).join('\n').trim();
            if (hasBudgetTable(sliced)) return sliced;
        }

        return [
            '| Item | Category | Status | Estimated | Actual |',
            '| --- | --- | --- | ---: | ---: |',
            '| TBD | General | Estimated | 0 | 0 |',
        ].join('\n');
    };

    const parseBudgetContent = (content: string, sessionId: string, sourceId: string, projectId?: string): Partial<BudgetItem>[] => {
        const lines = content.split('\n');
        let isTable = false;
        let colMap: Record<string, number> | null = null;
        let rowIndex = 0;
        const items: Partial<BudgetItem>[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Detect Header
            if (trimmed.startsWith('|') && (trimmed.toLowerCase().includes('item') || trimmed.toLowerCase().includes('category'))) {
                const headers = trimmed.split('|').map(h => h.trim().toLowerCase()).filter(h => h !== '');
                colMap = {
                    item: headers.findIndex(h => h.includes('item')),
                    category: headers.findIndex(h => h.includes('category')),
                    status: headers.findIndex(h => h.includes('status')),
                    estimated: headers.findIndex(h => h.includes('est') || h.includes('cost')),
                    actual: headers.findIndex(h => h.includes('actual')),
                    rationale: headers.findIndex(h => h.includes('rationale') || h.includes('notes')),
                };
                continue;
            }

            if (colMap && trimmed.startsWith('|') && trimmed.includes('---')) {
                isTable = true;
                continue;
            }

            if (isTable && trimmed.startsWith('|')) {
                const cols = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
                if (cols.length >= 2) {
                    rowIndex++;
                    const itemId = `${sourceId}-${rowIndex}`;

                    const getCol = (key: string) => {
                        if (!colMap) return null;
                        const idx = colMap[key as keyof typeof colMap];
                        if (idx !== undefined && idx !== -1 && cols[idx]) return cols[idx];
                        return null;
                    };

                    const rawItem = getCol('item');
                    const itemVal = rawItem || cols[0] || 'Unknown Item';

                    const rawCat = getCol('category');
                    const catVal = rawCat || cols[1] || 'General';

                    const rawEst = getCol('estimated');
                    const estStr = (rawEst || cols[3] || '0').replace(/[^0-9.]/g, '');

                    const rawAct = getCol('actual');
                    const actStr = (rawAct || cols[4] || '0').replace(/[^0-9.]/g, '');

                    const rawStatus = getCol('status');
                    const statusVal = rawStatus || (cols[2] as any) || 'Estimated';

                    const rawRationale = getCol('rationale');
                    const rationaleVal = rawRationale || '';

                    items.push({
                        id: itemId,
                        // Generate temporary ID or let DB handle? DB needs it. 
                        // But for bulk creation we might let action handle ID if undefined.
                        item: itemVal,
                        category: catVal,
                        status: statusVal,
                        estimated: parseFloat(estStr) || 0,
                        actual: parseFloat(actStr) || 0,
                        date: '-',
                        sessionId: sessionId,
                        sourceMessageId: sourceId,
                        projectId: projectId,
                        rationale: rationaleVal
                    });
                }
            }
        }
        return items;
    };

    const appendAssistantBudgetToSession = async (session: ChatSession, budgetContent: string) => {
        const nextMsgId = crypto.randomUUID();
        const nextMessage = {
            id: nextMsgId,
            role: 'assistant' as const,
            content: budgetContent,
            timestamp: new Date().toISOString(),
            type: 'text' as const,
        };
        const updatedMessages = [...session.messages, nextMessage];
        // Update session in DB
        await updateSessionMessages(session.id, updatedMessages);
        // Update local state to reflect immediately
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, messages: updatedMessages, updatedAt: Date.now() } : s));
    };

    const runAutoBudget = async (scale: 'indie' | 'standard' | 'studio', sessionsOverride?: ChatSession[]) => {
        if (isAutoBudgetRunning) return;
        setIsAutoBudgetRunning(true);
        setAutoBudgetError(null);

        try {
            let anyChanges = false;
            const sessionsToProcess = sessionsOverride || sessions;

            for (const session of sessionsToProcess) {
                for (let i = 0; i < session.messages.length; i++) {
                    const msg = session.messages[i];
                    if (msg.role !== 'user') continue;
                    if (!msg.content) continue;
                    if (!isFinalizeSceneCommand(msg.content)) continue;

                    const finalizeMessageId = msg.id;

                    const alreadyHasBudgetAfterFinalize = session.messages
                        .slice(i + 1)
                        .some(m => m.role === 'assistant' && typeof m.content === 'string' && hasBudgetTable(m.content));
                    if (alreadyHasBudgetAfterFinalize) {
                        continue;
                    }

                    const scenePrompt = extractScenePromptForFinalize(session, i);
                    if (!scenePrompt) continue;

                    const system = STUDIO_BUDGET_SYSTEM_PROMPT + `\n\nCURRENT PROJECT CONTEXT:\nProduction Scale: ${scale.toUpperCase()} (indie=lean, standard=normal, studio=premium).`;

                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [
                                { role: 'system', content: system },
                                { role: 'user', content: scenePrompt },
                            ]
                        }),
                    });

                    if (!res.ok) {
                        throw new Error(`Auto-budget failed (${res.status})`);
                    }
                    const data = await res.json();
                    const budgetTable = ensureBudgetTableFormat(String(data?.content || ''));

                    // 1. Add message to session
                    await appendAssistantBudgetToSession(session, budgetTable);

                    // 2. Parse and save items to DB
                    const pid = session.projectId || UNASSIGNED_PROJECT_ID;
                    const parsedItems = parseBudgetContent(budgetTable, session.id, finalizeMessageId, pid);

                    await addBudgetItemsBulkAction(parsedItems);
                    anyChanges = true;
                }
            }

            if (anyChanges) {
                // Refresh items
                const updatedItems = await getBudgetItemsAction(selectedProjectIdRef.current);
                setExpenses(updatedItems);
            }
        } catch (e: any) {
            setAutoBudgetError(e?.message || 'Auto-budget failed');
        } finally {
            setIsAutoBudgetRunning(false);
        }
    };

    useEffect(() => {
        const initProjectId = 'all'; // Default to all or use URL param if needed
        setSelectedProjectId(initProjectId);

        const load = async (projectId: string) => {
            try {
                const loadedProjects = await fetchProjects();
                setProjects(loadedProjects);

                const loadedSessions = await fetchSessions();
                setSessions(loadedSessions);

                const loadedItems = await getBudgetItemsAction(projectId);
                setExpenses(loadedItems);

                await runAutoBudget(productionScale, loadedSessions);
            } catch (error) {
                console.error("Failed to load data:", error);
            }
        };

        load(initProjectId);
        // Removed storage listener as we rely on revalidation or manual refresh for now
    }, []);

    useEffect(() => {
        if (sessions.length === 0) return;
        runAutoBudget(productionScale);
    }, [productionScale]);

    useEffect(() => {
        if (!selectedProjectId) return;

        selectedProjectIdRef.current = selectedProjectId;

        if (selectedProjectId !== 'all') {
            // Persist selection if needed, or just state
        }

        const refresh = async () => {
            const loadedProjects = await fetchProjects();
            setProjects(loadedProjects);
            const loadedSessions = await fetchSessions();
            setSessions(loadedSessions);
            const items = await getBudgetItemsAction(selectedProjectId);
            setExpenses(items);
        };
        refresh();
    }, [selectedProjectId]);

    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);

    // ... (existing effects)

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to delete this project? Data will be unassigned.")) return;

        // Optimistic update
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (selectedProjectId === projectId) {
            setSelectedProjectId('all');
        }

        await deleteProjectAction(projectId);

        // Refresh to be sure
        const allProjects = await fetchProjects();
        setProjects(allProjects);
    };

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<BudgetItem>>({});

    const handleEditStart = (item: BudgetItem) => {
        setEditingItemId(item.id);
        setEditValues({
            item: item.item,
            category: item.category,
            status: item.status,
            estimated: item.estimated,
            actual: item.actual
        });
    };

    const handleEditSave = async () => {
        if (!editingItemId) return;

        await updateBudgetItemAction(editingItemId, {
            item: editValues.item,
            category: editValues.category,
            status: editValues.status,
            estimated: editValues.estimated,
            actual: editValues.actual
        });

        // Refresh data
        const items = await getBudgetItemsAction(selectedProjectId);
        setExpenses(items);

        setEditingItemId(null);
        setEditValues({});
    };

    const handleEditCancel = () => {
        setEditingItemId(null);
        setEditValues({});
    };

    // ... (existing effects)

    const handleCreateProject = () => {
        setIsCreateProjectOpen(true);
    };

    const handleProjectSubmit = async (data: any) => {
        const created = await createProjectAction(data);
        if (created) {
            const allProjects = await fetchProjects();
            setProjects(allProjects);
            setSelectedProjectId(created.id);
            if (data.scale) setProductionScale(data.scale);
        }
    };

    const handleAssignSessionToSelectedProject = (sessionId: string) => {
        // Not implementing updateSessionProject action fully in this turn, 
        // but removing conflicting sync calls.
        if (!selectedProjectId || selectedProjectId === 'all') return;
        // setSessionProject(sessionId, selectedProjectId);
        // would need await updateSessionProject(sessionId, selectedProjectId)
    };

    const handleAddExpense = async () => {
        const projectIdToUse = (selectedProjectId === 'all' || !selectedProjectId) ? UNASSIGNED_PROJECT_ID : selectedProjectId;

        const newItem = await addBudgetItemAction({
            projectId: projectIdToUse,
            item: 'New Expense',
            category: 'General',
            status: 'Pending',
            estimated: 0,
            actual: 0
        });

        if (newItem) {
            const items = await getBudgetItemsAction(selectedProjectId);
            setExpenses(items);
            handleEditStart(newItem);
        }
    };

    const handleDelete = async (itemId: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            await deleteBudgetItemAction(itemId);
            const items = await getBudgetItemsAction(selectedProjectId);
            setExpenses(items);
        }
    };

    const totalEstimated = expenses.reduce((acc, curr) => acc + curr.estimated, 0);
    const totalActual = expenses.reduce((acc, curr) => acc + curr.actual, 0);

    const activeProject = selectedProjectId === 'all' ? null : projects.find(p => p.id === selectedProjectId);

    // Status Logic
    const budgetBaseline = (activeProject?.budgetLimit && activeProject.budgetLimit > 0) ? activeProject.budgetLimit : totalEstimated;
    const spendingRatio = budgetBaseline > 0 ? (totalActual / budgetBaseline) : 0;

    let statusText = "On Track";
    let statusColor = "text-emerald-400";
    let statusIconColor = "text-emerald-400";
    let statusBg = "bg-emerald-500/10";
    let statusDesc = "No major risks detected across active projects.";

    if (totalActual > budgetBaseline) {
        statusText = "Over Budget";
        statusColor = "text-red-400";
        statusIconColor = "text-red-400";
        statusBg = "bg-red-500/10";
        statusDesc = `Exceeded budget by $${(totalActual - budgetBaseline).toLocaleString()}.`;
    } else if (spendingRatio > 0.9) {
        statusText = "At Risk";
        statusColor = "text-amber-400";
        statusIconColor = "text-amber-400";
        statusBg = "bg-amber-500/10";
        statusDesc = "Approaching budget limit. Review expenses.";
    }

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
                        <div>
                            <h1 className="text-2xl font-bold font-serif text-cream-white tracking-tight">Production Budget</h1>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group z-50">
                            <button
                                onClick={() => setIsProjectsDropdownOpen(!isProjectsDropdownOpen)}
                                className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-gray-300 min-w-[160px]"
                            >
                                <span className="truncate max-w-[120px]">
                                    {selectedProjectId === 'all'
                                        ? "All Projects"
                                        : projects.find(p => p.id === selectedProjectId)?.name || "Select Project"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProjectsDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProjectsDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsProjectsDropdownOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#0b1221] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => {
                                                setSelectedProjectId('all');
                                                setIsProjectsDropdownOpen(false);
                                            }}
                                            className={`flex items-center px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left w-full ${selectedProjectId === 'all' ? 'text-cinelock-accent bg-cinelock-accent/5' : 'text-gray-300'}`}
                                        >
                                            All Projects
                                        </button>
                                        <div className="h-px bg-white/5 my-1"></div>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {projects.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className={`group/item flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors ${selectedProjectId === p.id ? 'bg-white/5' : ''}`}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProjectId(p.id);
                                                            setIsProjectsDropdownOpen(false);
                                                        }}
                                                        className={`text-sm text-left truncate flex-1 ${selectedProjectId === p.id ? 'text-cinelock-accent' : 'text-gray-300'}`}
                                                    >
                                                        {p.name}
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteProject(p.id);
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-px bg-white/5 my-1"></div>
                                        <button
                                            onClick={() => {
                                                setIsCreateProjectOpen(true);
                                                setIsProjectsDropdownOpen(false);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
                                        >
                                            <Plus className="w-4 h-4" /> Create New Project
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>


                        <button
                            onClick={handleAddExpense}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-sm font-medium shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)]"
                        >
                            <Plus className="w-4 h-4" /> Add Expense
                        </button>
                    </div>
                </header>

                {selectedProjectId === UNASSIGNED_PROJECT_ID ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                            <AlertCircle className="w-10 h-10 text-amber-500/50" />
                        </div>
                        <h2 className="text-xl font-bold text-cream-white mb-2">Project Selection Required</h2>
                        <p className="text-gray-400 max-w-md mb-8">
                            Auto-budgeting is disabled for unassigned items. Please select an active project or create a new one to generate budget data.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 space-y-8">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="group bg-[#0b1221]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden transition-all hover:border-white/10 hover:bg-[#0b1221]/80">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-cinelock-accent/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 transition-opacity opacity-50 group-hover:opacity-100"></div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Total Estimated</h3>
                                <div className="flex items-baseline gap-2 relative z-10">
                                    <span className="text-5xl font-bold font-serif text-cream-white tracking-tight">${totalEstimated.toLocaleString()}</span>
                                </div>
                                <div className="mt-4 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                    <div className="bg-cinelock-accent h-full rounded-full transition-all duration-1000 ease-out" style={{ width: totalEstimated > 0 ? '75%' : '0%' }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-medium">Derived from generated scripts</p>
                            </div>

                            <div className="group bg-[#0b1221]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden transition-all hover:border-white/10 hover:bg-[#0b1221]/80">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 transition-opacity opacity-50 group-hover:opacity-100"></div>
                                <h3 className="text-sm font-medium text-gray-400 mb-1">Actual Spend</h3>
                                <div className="flex items-baseline gap-2 relative z-10">
                                    <span className="text-5xl font-bold font-serif text-cream-white tracking-tight">${totalActual.toLocaleString()}</span>
                                </div>
                                <div className="mt-4 w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                    <div className={`bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out`} style={{ width: budgetBaseline > 0 ? `${Math.min((totalActual / budgetBaseline) * 100, 100)}%` : '0%' }}></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-medium">
                                    {budgetBaseline > 0 ? `${Math.round((totalActual / budgetBaseline) * 100)}% of budget used` : 'No budget set'}
                                </p>
                            </div>

                            <div className="group bg-[#0b1221]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden transition-all hover:border-white/10 hover:bg-[#0b1221]/80 flex flex-col justify-between">
                                <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] translate-y-1/4 translate-x-1/4"></div>
                                <div className="flex items-start justify-between relative z-10 h-full">
                                    <div className="flex flex-col justify-between h-full">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1">Budget Status</h3>
                                        <span className={`text-4xl font-bold font-serif ${statusColor} tracking-tight mt-1`}>
                                            {statusText}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-4 font-medium">{statusDesc}</p>
                                    </div>
                                    <div className={`p-4 ${statusBg} rounded-2xl border border-white/5`}>
                                        {statusText === 'At Risk' ? <AlertCircle className={`w-6 h-6 ${statusIconColor}`} /> :
                                            statusText === 'Over Budget' ? <AlertCircle className={`w-6 h-6 ${statusIconColor}`} /> :
                                                <PieChart className={`w-6 h-6 ${statusIconColor}`} />}
                                    </div>
                                </div>

                            </div>
                        </div>



                        {/* Table */}
                        <div className="bg-[#0b1221]/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl shadow-black/20 pb-2">


                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/[0.02] text-gray-400 text-xs uppercase font-serif tracking-wider">
                                        <tr>
                                            <th className="px-8 py-5 font-medium">Item Name</th>
                                            <th className="px-6 py-5 font-medium">Category</th>
                                            <th className="px-6 py-5 font-medium">Status</th>
                                            <th className="px-6 py-5 text-right font-medium">Est. Cost</th>
                                            <th className="px-8 py-5 text-right font-medium">Actual</th>
                                            <th className="px-4 py-5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {expenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                                            <CreditCard className="w-8 h-8 text-gray-600" />
                                                        </div>
                                                        <h3 className="text-cream-white font-medium">No expenses recorded</h3>
                                                        <p className="text-sm text-gray-500 max-w-sm mb-4">
                                                            Start a chat scan or manually add expenses to begin tracking your production budget.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            expenses.map((expense) => {
                                                const isEditing = editingItemId === expense.id;
                                                return (
                                                    <tr key={expense.id} className={`transition-colors group ${isEditing ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}>
                                                        <td className="px-8 py-4">
                                                            {isEditing ? (
                                                                <input
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-cream-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cinelock-accent/50 focus:border-cinelock-accent/50 transition-all font-medium"
                                                                    value={editValues.item || ''}
                                                                    onChange={e => setEditValues(prev => ({ ...prev, item: e.target.value }))}
                                                                    placeholder="Item Name"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <div className="font-medium text-cream-white text-base">{expense.item}</div>
                                                                    {expense.rationale && (
                                                                        <div className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                                                                            {expense.rationale}
                                                                        </div>
                                                                    )}
                                                                    {expense.date !== '-' && <div className="text-xs text-gray-500 mt-1">Paid on {expense.date}</div>}
                                                                </>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isEditing ? (
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-gray-300 focus:outline-none focus:ring-1 focus:ring-cinelock-accent/50 transition-all cursor-pointer"
                                                                        value={editValues.category || ''}
                                                                        onChange={e => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                                                                    >
                                                                        {["Cast", "Camera", "Lighting", "Art", "Location", "Wardrobe", "VFX", "General"].map(c => <option key={c} value={c}>{c}</option>)}
                                                                    </select>
                                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                                </div>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-medium text-gray-400 border border-white/5">
                                                                    {expense.category}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {isEditing ? (
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-gray-300 focus:outline-none focus:ring-1 focus:ring-cinelock-accent/50 transition-all cursor-pointer"
                                                                        value={editValues.status || ''}
                                                                        onChange={e => setEditValues(prev => ({ ...prev, status: e.target.value as any }))}
                                                                    >
                                                                        <option value="Paid">Paid</option>
                                                                        <option value="Pending">Pending</option>
                                                                        <option value="Estimated">Estimated</option>
                                                                        <option value="Over-budget">Over-budget</option>
                                                                    </select>
                                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                                                </div>
                                                            ) : (
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${expense.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                    expense.status === 'Over-budget' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                        expense.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                                    }`}>
                                                                    {expense.status}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-400">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-gray-300 text-right font-serif focus:outline-none focus:ring-1 focus:ring-cinelock-accent/50 focus:border-cinelock-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    value={editValues.estimated || 0}
                                                                    onChange={e => setEditValues(prev => ({ ...prev, estimated: parseFloat(e.target.value) }))}
                                                                />
                                                            ) : (
                                                                `$${expense.estimated.toLocaleString()}`
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-cream-white text-right font-serif focus:outline-none focus:ring-1 focus:ring-cinelock-accent/50 focus:border-cinelock-accent/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    value={editValues.actual || 0}
                                                                    onChange={e => setEditValues(prev => ({ ...prev, actual: parseFloat(e.target.value) }))}
                                                                />
                                                            ) : (
                                                                <span className="font-mono text-cream-white">${expense.actual.toLocaleString()}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 text-right flex justify-end gap-2">
                                                            {isEditing ? (
                                                                <>
                                                                    <button onClick={handleEditSave} className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 rounded-xl transition-all">
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={handleEditCancel} className="p-2.5 hover:bg-white/10 text-gray-400 hover:text-red-400 rounded-xl transition-all">
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => handleEditStart(expense)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/5 rounded-lg text-gray-500 hover:text-cinelock-accent transition-all">
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(expense.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {/* Modals */}
            <CreateProjectModal
                isOpen={isCreateProjectOpen}
                onClose={() => setIsCreateProjectOpen(false)}
                onSubmit={handleProjectSubmit}
            />
        </div>
    );
}
