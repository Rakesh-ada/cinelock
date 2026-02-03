import mongoose, { Schema, Model } from 'mongoose';

export interface IProject {
    id: string; // Maintain compatibility with UUID
    name: string;
    description?: string;
    genre?: string;
    scale?: 'indie' | 'standard' | 'studio';
    budgetLimit?: number;
    userId: string; // Clerk User ID
    createdAt: number;
    updatedAt: number;
}

const ProjectSchema = new Schema<IProject>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    genre: { type: String, default: 'General' },
    scale: { type: String, enum: ['indie', 'standard', 'studio'], default: 'standard' },
    budgetLimit: { type: Number, default: 0 },
    userId: { type: String, required: true, index: true },
    createdAt: { type: Number, default: () => Date.now() },
    updatedAt: { type: Number, default: () => Date.now() }
});

ProjectSchema.index({ userId: 1, updatedAt: -1 });

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
