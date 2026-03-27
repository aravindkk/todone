import React, { useState } from 'react';
import { CalendarDays, TrendingUp, Trophy } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { storage } from '../lib/storage';

const FEEDBACK = {
    sad: "Tough weeks build resilience. You showed up, and that counts more than you know. Next week is a fresh start — you've got this! 💙",
    neutral: "Steady progress is still progress. Every task you finished moved you forward. Keep building on that momentum! 🌱",
    happy: "That's the energy! You crushed it this week. Carry that momentum into next week and see what you can achieve! 🚀",
};

export function FridaySummaryModal({ isOpen, onClose, userName, stats }) {
    const [feedback, setFeedback] = useState(null);

    if (!isOpen) return null;

    const handleRating = async (rating) => {
        const ratings = await storage.get('todo_weekly_ratings', []);
        ratings.push({ date: new Date().toISOString(), rating });
        await storage.set('todo_weekly_ratings', ratings);
        setFeedback(FEEDBACK[rating]);
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-md p-6"
            hideHeader={true}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Weekly Wrap-Up</h2>
                    <p className="text-sm text-slate-500">Happy Friday, {userName || 'friend'}!</p>
                </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">This Week's Highlights</h3>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{stats.completedThisWeek} Tasks Completed</p>
                            <p className="text-xs text-slate-500">Great momentum this week!</p>
                        </div>
                    </div>

                    {stats.longestCompletedTask && (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">Longest Pending Mastered</p>
                                <p className="text-xs text-slate-500 truncate">"{stats.longestCompletedTask.description}"</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center pb-2">
                {feedback ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm text-slate-700 leading-relaxed mb-4">{feedback}</p>
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Have a great weekend!
                        </button>
                    </div>
                ) : (
                    <>
                        <h4 className="text-sm font-medium text-slate-700 mb-4">How did this week feel overall?</h4>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => handleRating('sad')}
                                className="text-4xl hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                                title="Tough week"
                            >
                                😢
                            </button>
                            <button
                                onClick={() => handleRating('neutral')}
                                className="text-4xl hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                                title="It was okay"
                            >
                                😐
                            </button>
                            <button
                                onClick={() => handleRating('happy')}
                                className="text-4xl hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                                title="Great week!"
                            >
                                🥳
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    );
}
