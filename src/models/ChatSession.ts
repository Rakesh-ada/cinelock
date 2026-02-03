import mongoose, { Schema, Model } from 'mongoose';

// Define the Message sub-schema properly
const MessageSchema = new Schema({
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'panorama'], default: 'text' },
    imageUrl: { type: String },
    panoramaUrl: { type: String },
    enhancedPrompt: { type: String }
}, { _id: false });

export interface IChatSession {
    id: string;
    title: string;
    messages: any[]; // Using any[] for simplicity in TS interface, but validated by Schema
    userId: string;
    projectId?: string;
    updatedAt: number;
}

const ChatSessionSchema = new Schema<IChatSession>({
    id: { type: String, required: true, unique: true },
    title: { type: String, default: 'New Session' },
    messages: [MessageSchema],
    userId: { type: String, required: true, index: true },
    projectId: { type: String },
    updatedAt: { type: Number, default: () => Date.now() }
});

ChatSessionSchema.index({ userId: 1, updatedAt: -1 });

const ChatSession: Model<IChatSession> = mongoose.models.ChatSession || mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export default ChatSession;
