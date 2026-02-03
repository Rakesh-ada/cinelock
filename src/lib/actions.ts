'use server';

import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "./db";
import Project, { IProject } from "@/models/Project";
import BudgetItem, { IBudgetItem } from "@/models/BudgetItem";
import ChatSession, { IChatSession } from "@/models/ChatSession";
import Scene, { IScene } from "@/models/Scene";
import { revalidatePath } from "next/cache";

const normalizeMessages = (messages: any[]) => {
    if (!Array.isArray(messages)) return [];
    return messages.map((m: any) => {
        const ts = m?.timestamp;
        const normalizedTimestamp = ts instanceof Date
            ? ts.toISOString()
            : typeof ts === 'string'
                ? ts
                : ts
                    ? new Date(ts).toISOString()
                    : new Date().toISOString();

        return {
            ...m,
            timestamp: normalizedTimestamp,
        };
    });
};

// --- Projects ---

export async function getProjects(): Promise<IProject[]> {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();
    // @ts-ignore
    const projects = await Project.find({ userId }).sort({ updatedAt: -1 }).lean();

    // Mongoose returns _id objects, we need to handle serialization if passing to client components 
    // strictly speaking, but for now we rely on the shaped interface. 
    // We might need to map _id to string if we use _id. 
    // Our schema has a custom 'id' string field, so we use that.

    return projects.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
    }));
}

export async function createProjectAction(data: Partial<IProject> & { name: string }): Promise<IProject | null> {
    const { userId } = await auth();
    if (!userId) return null;

    await connectToDatabase();

    const newProject = await Project.create({
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || '',
        genre: data.genre,
        scale: data.scale,
        budgetLimit: data.budgetLimit,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    revalidatePath('/projects');
    return JSON.parse(JSON.stringify(newProject));
}

// --- Sessions ---

export async function getSessions(): Promise<IChatSession[]> {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();
    // @ts-ignore
    const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 }).lean();
    return sessions.map((s: any) => ({ ...s, _id: s._id.toString() }));
}

export async function createSessionAction(data: { id?: string, title?: string }): Promise<IChatSession | null> {
    const { userId } = await auth();
    if (!userId) return null;

    await connectToDatabase();
    const newSession = await ChatSession.create({
        id: data.id || crypto.randomUUID(),
        title: data.title || 'New Session',
        messages: [],
        userId,
        updatedAt: Date.now()
    });

    revalidatePath('/chat');
    return JSON.parse(JSON.stringify(newSession));
}

export async function updateSessionMessages(id: string, messages: any[]) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();
    await ChatSession.findOneAndUpdate(
        { id, userId },
        { $set: { messages: normalizeMessages(messages), updatedAt: Date.now() } }
    );
}

export async function updateSessionAction(id: string, updates: { title?: string; messages?: any[]; projectId?: string }) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();

    const $set: any = { updatedAt: Date.now() };
    if (typeof updates.title === 'string') $set.title = updates.title;
    if (typeof updates.projectId === 'string') $set.projectId = updates.projectId;
    if (updates.messages) $set.messages = normalizeMessages(updates.messages);

    await ChatSession.findOneAndUpdate(
        { id, userId },
        { $set }
    );
}

export async function updateSessionProjectAction(id: string, projectId: string) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();
    await ChatSession.findOneAndUpdate(
        { id, userId },
        { $set: { projectId, updatedAt: Date.now() } }
    );

    revalidatePath('/chat');
    revalidatePath('/budget');
}

export async function deleteSessionAction(id: string) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();

    // Cascade delete: Delete all scenes associated with this session
    await Scene.deleteMany({ sessionId: id, userId });

    // Cascade delete: Delete all budget items associated with this session (if any)
    await BudgetItem.deleteMany({ sessionId: id, userId });

    await ChatSession.deleteOne({ id, userId });
    revalidatePath('/chat');
    revalidatePath('/scenes');
    revalidatePath('/budget');
}

// --- Budget Items ---

export async function getBudgetItemsAction(projectId?: string): Promise<IBudgetItem[]> {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();
    const query: any = { userId };
    if (projectId && projectId !== 'all') {
        query.projectId = projectId;
    }

    // @ts-ignore
    const items = await BudgetItem.find(query).sort({ _id: -1 }).lean();
    return items.map((i: any) => ({ ...i, _id: i._id.toString() }));
}

export async function addBudgetItemAction(data: Partial<IBudgetItem>): Promise<IBudgetItem | null> {
    const { userId } = await auth();
    if (!userId) return null;

    await connectToDatabase();
    const newItem = await BudgetItem.create({
        id: data.id || crypto.randomUUID(),
        item: data.item || 'New Item',
        category: data.category || 'General',
        status: data.status || 'Estimated',
        estimated: data.estimated || 0,
        actual: data.actual || 0,
        date: data.date || '-',
        sessionId: data.sessionId,
        sourceMessageId: data.sourceMessageId,
        projectId: data.projectId,
        rationale: data.rationale,
        userId
    });

    revalidatePath('/budget');
    return JSON.parse(JSON.stringify(newItem));
}

export async function addBudgetItemsBulkAction(items: Partial<IBudgetItem>[]): Promise<IBudgetItem[]> {
    console.log("[ACTION] addBudgetItemsBulkAction called with", items.length, "items");
    const { userId } = await auth();
    if (!userId) {
        console.error("[ACTION] addBudgetItemsBulkAction failed: No userId");
        return [];
    }

    try {
        await connectToDatabase();
        console.log("[ACTION] Database connected for bulk insert");
    } catch (error: any) {
        console.error("[ACTION] Database connection failed:", error.message);
        throw error;
    }

    const docs = (Array.isArray(items) ? items : []).map((data) => ({
        id: data.id || crypto.randomUUID(),
        item: data.item || 'New Item',
        category: data.category || 'General',
        status: data.status || 'Estimated',
        estimated: data.estimated || 0,
        actual: data.actual || 0,
        date: data.date || '-',
        sessionId: data.sessionId,
        sourceMessageId: data.sourceMessageId,
        projectId: data.projectId,
        rationale: data.rationale,
        userId
    }));

    if (docs.length === 0) return [];

    const ops = docs.map((doc) => ({
        updateOne: {
            filter: { id: doc.id, userId },
            update: { $setOnInsert: doc },
            upsert: true,
        }
    }));

    // @ts-ignore
    const result = await BudgetItem.bulkWrite(ops, { ordered: false });
    console.log("[ACTION] Bulk insert completed:", result.upsertedCount, "inserted,", result.modifiedCount, "modified");
    
    revalidatePath('/budget');
    return [];
}

export async function updateBudgetItemAction(id: string, updates: Partial<IBudgetItem>) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();
    await BudgetItem.findOneAndUpdate(
        { id, userId },
        { $set: updates }
    );
    revalidatePath('/budget');
}

export async function deleteBudgetItemAction(id: string) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();
    await BudgetItem.deleteOne({ id, userId });
    revalidatePath('/budget');
}
// --- Scenes ---

export async function getScenes(): Promise<IScene[]> {
    const { userId } = await auth();
    if (!userId) return [];

    await connectToDatabase();
    // @ts-ignore
    const scenes = await Scene.find({ userId }).sort({ timestamp: -1 }).lean();
    return scenes.map((s: any) => ({ ...s, _id: s._id.toString() }));
}

export async function createSceneAction(data: Partial<IScene>): Promise<IScene | null> {
    console.log("[ACTION] createSceneAction called with data:", { id: data.id, projectId: data.projectId, sessionId: data.sessionId });
    const { userId } = await auth();
    if (!userId) {
        console.error("[ACTION] createSceneAction failed: No userId");
        return null;
    }
    console.log("[ACTION] User authenticated:", userId);

    try {
        await connectToDatabase();
        console.log("[ACTION] Database connected");
    } catch (error: any) {
        console.error("[ACTION] Database connection failed:", error.message);
        throw error;
    }
    
    const newScene = await Scene.create({
        id: data.id || crypto.randomUUID(),
        imageUrl: data.imageUrl,
        description: data.description || '',
        projectId: data.projectId,
        budgetContent: data.budgetContent,
        timestamp: new Date(),
        userId,
        sessionId: data.sessionId
    });
    
    console.log("[ACTION] Scene created successfully:", newScene.id);

    // revalidatePath('/chat'); // Scenes might be displayed in chat
    revalidatePath('/scenes');
    return JSON.parse(JSON.stringify(newScene));
}

export async function deleteSceneAction(id: string) {
    const { userId } = await auth();
    if (!userId) return;

    await connectToDatabase();
    await Scene.deleteOne({ id, userId });
    revalidatePath('/scenes');
}
