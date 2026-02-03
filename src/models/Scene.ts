import mongoose, { Schema, Model } from 'mongoose';

export interface IScene {
    id: string;
    imageUrl: string;
    description: string;
    projectId?: string;
    budgetContent?: string; // Raw markdown budget or JSON string if needed
    timestamp: Date;
    userId: string;
    sessionId?: string;
}

const SceneSchema = new Schema<IScene>({
    id: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
    projectId: { type: String, index: true },
    budgetContent: { type: String },
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, index: true }
});

SceneSchema.index({ userId: 1, timestamp: -1 });
SceneSchema.index({ userId: 1, projectId: 1, timestamp: -1 });

const Scene: Model<IScene> = mongoose.models.Scene || mongoose.model<IScene>('Scene', SceneSchema);

export default Scene;
