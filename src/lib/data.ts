export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string | Date;
    type?: 'text' | 'image' | 'panorama';
    imageUrl?: string;
    panoramaUrl?: string;
    enhancedPrompt?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
    projectId?: string;
}

export interface Asset {
    id: string;
    type: 'image' | 'panorama';
    url: string;
    title: string;
    prompt: string;
    date: Date;
    sessionId: string;
}

export interface BudgetItem {
    id: string;
    item: string;
    category: string;
    status: 'Paid' | 'Pending' | 'Estimated' | 'Over-budget';
    estimated: number;
    actual: number;
    date: string;
    sessionId?: string;
    sourceMessageId?: string;
    projectId?: string; // Explicit project assignment
    rationale?: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    genre?: string;
    scale?: 'indie' | 'standard' | 'studio';
    budgetLimit?: number;
    createdAt: number;
    updatedAt: number;
}

export const UNASSIGNED_PROJECT_ID = 'unassigned';


