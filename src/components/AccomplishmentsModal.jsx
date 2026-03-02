import { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Trophy, Flame, Timer, CheckCircle2, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { aiService } from "../services/ai";

export function AccomplishmentsModal({ isOpen, onClose, stats, streak, userName }) {
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

    // AI Insight state
    const [insight, setInsight] = useState(null);
    const [loadingInsight, setLoadingInsight] = useState(false);

    useEffect(() => {
        if (!isOpen || !stats.hourlyData) return;

        let isMounted = true;
        const fetchInsight = async () => {
            setLoadingInsight(true);
            const res = await aiService.getActivityInsights(stats.hourlyData, { userName });
            if (isMounted) {
                if (!res.error && res.insight) {
                    setInsight(res.insight);
                } else {
                    setInsight("Keep tracking tasks at your own pace!");
                }
                setLoadingInsight(false);
            }
        };
        fetchInsight();
        return () => { isMounted = false; };
    }, [isOpen, stats.hourlyData]);

    const maxActivity = stats.hourlyData ? Math.max(...stats.hourlyData.map(d => Math.max(d.created, d.completed))) : 0;
    const chartMax = Math.max(maxActivity, 5);

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

                {/* Local Time Activity Chart (Feature 10) */}
                {stats.hourlyData && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                Daily Rhythm (Last 7 Days)
                            </h4>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 mb-6">
                            {loadingInsight ? (
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyzing your best hours...
                                </div>
                            ) : (
                                <p className="text-slate-700 italic font-medium">✨ "{insight}"</p>
                            )}
                        </div>

                        <div className="flex items-end h-40 gap-1 pb-4 border-b border-slate-100 overflow-x-auto min-w-max">
                            {stats.hourlyData.map((data, i) => {
                                const createdPct = `${(data.created / chartMax) * 100}%`;
                                const compPct = `${(data.completed / chartMax) * 100}%`;
                                const isBusy = data.created > 0 || data.completed > 0;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative min-w-[20px]">
                                        <div className="w-full h-full flex items-end justify-center px-0.5 relative">
                                            {/* Created */}
                                            <div
                                                className="w-1/2 bg-slate-200 rounded-t-sm transition-all"
                                                style={{ height: createdPct, minHeight: data.created > 0 ? '4px' : '0' }}
                                            />
                                            {/* Completed */}
                                            <div
                                                className="w-1/2 bg-blue-400 rounded-t-sm transition-all absolute bottom-0 left-1/2"
                                                style={{ height: compPct, minHeight: data.completed > 0 ? '4px' : '0' }}
                                            />
                                            {/* Tooltip */}
                                            {isBusy && (
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none text-center">
                                                    <div>{i % 12 || 12}{i < 12 ? 'am' : 'pm'}</div>
                                                    <div className="text-slate-300">{data.created} Cr / {data.completed} Co</div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-2 rotate-45 origin-left">
                                            {i % 4 === 0 ? `${i}h` : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-6 mt-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                <span className="text-xs text-slate-500 font-medium">Tasks Added</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                <span className="text-xs text-slate-500 font-medium">Tasks Finished</span>
                            </div>
                        </div>
                    </div>
                )}

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
