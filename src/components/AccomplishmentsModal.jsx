import { Dialog } from "./ui/Dialog";
import { Trophy, Flame, Timer, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

export function AccomplishmentsModal({ isOpen, onClose, stats, streak }) {
    if (!isOpen) return null;

    // Generate last 365 days for heatmap
    const getHeatmapDays = () => {
        const days = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
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

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-4xl h-[90vh] flex flex-col"
            hideHeader={true}
        >
            <div className="flex items-center gap-4 mb-8 shrink-0">
                <div className="p-3 bg-orange-50 rounded-xl text-orange-500">
                    <Trophy className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Your Journey</h3>
                    <p className="text-slate-500">Consistency is key. Look how far you've come!</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-10">
                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 flex flex-col items-center text-center">
                        <Flame className="w-8 h-8 text-orange-500 mb-2" />
                        <span className="text-3xl font-bold text-slate-800">{streak}</span>
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Current Streak</span>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                        <CheckCircle2 className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-3xl font-bold text-slate-800">{stats.completed30Days}</span>
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Tasks (30 Days)</span>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col items-center text-center">
                        <TrendingUp className="w-8 h-8 text-purple-500 mb-2" />
                        <span className="text-3xl font-bold text-slate-800">{stats.totalCompleted}</span>
                        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">All Time</span>
                    </div>
                </div>

                {/* Heatmap */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                        Activity Log (Last Year)
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {heatmapDays.map((date, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-slate-300",
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

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Timer className="w-5 h-5 text-green-500" />
                            Tasks you excel at (&lt; 15m)
                        </h4>
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

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Timer className="w-5 h-5 text-orange-500" />
                            Tasks which need attention (&gt; 6h)
                        </h4>
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
        </Dialog>
    );
}
