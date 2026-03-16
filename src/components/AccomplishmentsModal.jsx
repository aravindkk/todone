import { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Trophy, Flame, Timer, CheckCircle2, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { aiService } from "../services/ai";

export function AccomplishmentsModal({ isOpen, onClose, stats, streak, userName, hasRecentTasks = true }) {
    if (!isOpen) return null;

    // Generate last 365 days for heatmap
    const getHeatmapDays = () => {
        const days = [];
        const today = new Date();
        // Generate last 30 days for heatmap
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days;
    };

    const heatmapDays = getHeatmapDays();

    // Helper to get color based on count
    const getHeatmapColor = (date) => {
        const dateKey = date.toISOString().split('T')[0];
        const count = stats.heatmap[dateKey] || 0;
        if (count === 0) return "bg-slate-100";
        if (count <= 2) return "bg-green-200";
        if (count <= 5) return "bg-green-400";
        return "bg-green-600";
    };

    // Removed AI Insight state and Daily Rhythm chart logic

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-4xl h-[90vh] flex flex-col"
            hideHeader={true}
        >
            <div className="flex items-center gap-4 mb-8 shrink-0">
                <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
                    <Flame className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Streak: {streak || 0} Days</h3>
                    <p className="text-slate-500">Consistency is key. Look how far you've come!</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-10">
                {/* Heatmap & Insights */}
                <div className="space-y-6">
                    {/* Heatmap */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 relative z-20 bg-white/50 backdrop-blur-sm -mx-2 px-2 py-1 rounded-lg">
                            <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                            Activity Log (Last 30 Days)
                        </h4>

                        <div className={cn(
                            "transition-all duration-500 relative z-0"
                        )}>
                            <div className="flex flex-wrap gap-1">
                                {heatmapDays.map((date, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-3 h-3 rounded-sm transition-all",
                                            hasRecentTasks && "hover:ring-2 hover:ring-slate-300",
                                            getHeatmapColor(date)
                                        )}
                                        title={`${date.toDateString()}: ${stats.heatmap[date.toISOString().split('T')[0]] || 0} tasks`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 justify-end">
                                <span>Less</span>
                                <div className="w-3 h-3 bg-slate-100 rounded-sm" />
                                <div className="w-3 h-3 bg-green-200 rounded-sm" />
                                <div className="w-3 h-3 bg-green-400 rounded-sm" />
                                <div className="w-3 h-3 bg-green-600 rounded-sm" />
                                <span>More</span>
                            </div>
                        </div>

                        {/* Bug 61: Task Movement Stats */}
                        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
                            <div>
                                <h5 className="text-sm font-semibold text-slate-800 mb-1">Task Movement</h5>
                                <p className="text-xs text-slate-500 mb-3">Tasks pushed to tomorrow</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-3xl font-bold text-slate-800">{stats.percentMoved || 0}%</span>
                                    <span className="text-sm text-slate-500 mb-1">of all tasks</span>
                                </div>
                            </div>
                            <div>
                                <h5 className="text-sm font-semibold text-slate-800 mb-2">Most Delayed Tasks</h5>
                                {stats.topMovedTasks && stats.topMovedTasks.length > 0 ? (
                                    <ul className="space-y-2">
                                        {stats.topMovedTasks.map(t => (
                                            <li key={t.id} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600 truncate pr-2" title={t.description}>{t.description}</span>
                                                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                                                    {t.moveCount}x
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No delayed tasks.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 relative z-20 bg-white/50 backdrop-blur-sm -mx-2 px-2 py-1 rounded-lg">
                                <Timer className="w-5 h-5 text-green-500" />
                                Tasks you excel at (&lt; 4h)
                            </h4>
                            <div className={cn(
                                "transition-all duration-500 relative z-0"
                            )}>
                                {stats.quickTasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.quickTasks.map(task => (
                                            <div key={task.id} className="text-sm text-slate-600 flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                <span>{task.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No tasks in this category yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2 relative z-20 bg-white/50 backdrop-blur-sm -mx-2 px-2 py-1 rounded-lg">
                                <Timer className="w-5 h-5 text-orange-500" />
                                Tasks which need attention (&gt; 6h)
                            </h4>
                            <div className={cn(
                                "transition-all duration-500 relative z-0"
                            )}>
                                {stats.longTasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.longTasks.map(task => (
                                            <div key={task.id} className="text-sm text-slate-600 flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                                                <span>{task.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No tasks in this category yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
