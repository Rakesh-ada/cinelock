"use client";

import React, { useState } from 'react';
import { X, Film, DollarSign, Scale, FileText } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description: string; genre: string; scale: 'indie' | 'standard' | 'studio'; budgetLimit: number }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');
    const [scale, setScale] = useState<'indie' | 'standard' | 'studio'>('standard');
    const [budgetLimit, setBudgetLimit] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            description,
            genre,
            scale,
            budgetLimit: parseFloat(budgetLimit) || 0
        });
        // Reset form
        setName('');
        setDescription('');
        setGenre('');
        setScale('standard');
        setBudgetLimit('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#0b1221] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-lg font-semibold text-cream-white flex items-center gap-2">
                        <Film className="w-5 h-5 text-cinelock-accent" />
                        New Production
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Project Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Project Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Starfield Odyssey"
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-cream-white placeholder-gray-600 focus:outline-none focus:border-cinelock-accent/50 focus:ring-1 focus:ring-cinelock-accent/50 transition-all"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Genre & Budget Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Genre</label>
                            <input
                                type="text"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                placeholder="Sci-Fi, Horror..."
                                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-cream-white placeholder-gray-600 focus:outline-none focus:border-cinelock-accent/50 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Est. Budget Limit</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="number"
                                    value={budgetLimit}
                                    onChange={(e) => setBudgetLimit(e.target.value)}
                                    placeholder="Optional"
                                    className="w-full pl-9 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-cream-white placeholder-gray-600 focus:outline-none focus:border-cinelock-accent/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scale */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Production Scale</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['indie', 'standard', 'studio'] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setScale(s)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all capitalized ${scale === s
                                            ? 'bg-cinelock-accent/20 border-cinelock-accent text-cinelock-accent shadow-[0_0_15px_-5px_rgba(var(--cinelock-accent-rgb),0.3)]'
                                            : 'bg-black/30 border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Logline / Description</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of the story, tone, and setting..."
                                className="w-full pl-9 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-cream-white placeholder-gray-600 focus:outline-none focus:border-cinelock-accent/50 transition-all min-h-[100px] resize-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-6 py-2.5 rounded-xl bg-cinelock-accent text-white font-medium hover:bg-cinelock-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cinelock-accent/20"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
