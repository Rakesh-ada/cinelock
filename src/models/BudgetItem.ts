import mongoose, { Schema, Model } from 'mongoose';

export interface IBudgetItem {
    id: string;
    item: string;
    category: string;
    status: 'Paid' | 'Pending' | 'Estimated' | 'Over-budget';
    estimated: number;
    actual: number;
    date: string;
    sessionId?: string;
    sourceMessageId?: string;
    projectId?: string;
    rationale?: string;
    userId: string; // Clerk User ID
}

const BudgetItemSchema = new Schema<IBudgetItem>({
    id: { type: String, required: true, unique: true },
    item: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['Paid', 'Pending', 'Estimated', 'Over-budget'], default: 'Estimated' },
    estimated: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    date: { type: String, default: '-' },
    sessionId: { type: String },
    sourceMessageId: { type: String },
    projectId: { type: String, index: true },
    rationale: { type: String },
    userId: { type: String, required: true, index: true }
});

BudgetItemSchema.index({ userId: 1, projectId: 1, _id: -1 });
BudgetItemSchema.index({ userId: 1, sessionId: 1 });

const BudgetItem: Model<IBudgetItem> = mongoose.models.BudgetItem || mongoose.model<IBudgetItem>('BudgetItem', BudgetItemSchema);

export default BudgetItem;
