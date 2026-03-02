import { useState, useEffect } from "react";
import { Dialog } from "./ui/Dialog";
import { Calendar, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { aiService } from "../services/ai";

export function CalendarView({ isOpen, onClose, tasks, userName }) {
    const [recap, setRecap] = useState(null);
    const [isLoadingRecap, setIsLoadingRecap] = useState(false);

    // Calculate chart data internally since it doesn't change while modal is open (usually)
    const chartData = [];
    let maxCount = 0;

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];

        const createdCount = tasks.filter(t => t.createdAt && t.createdAt.startsWith(dateKey)).length;
        const completedCount = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(dateKey)).length;

        chartData.push({
            date: dateKey,
            label: d.toLocaleDateString(undefined, { weekday: 'short' }),
            created: createdCount,
            completed: completedCount
        });

        if (createdCount > maxCount) maxCount = createdCount;
        if (completedCount > maxCount) maxCount = completedCount;
    }

    if (maxCount < 5) maxCount = 5; // Minimum scale

    useEffect(() => {
        if (!isOpen) {
            setRecap(null);
            return;
        }

        const fetchRecap = async () => {
            setIsLoadingRecap(true);
            const res = await aiService.getHistoryRecap(chartData, { userName });
            if (!res.error) {
                setRecap(res.recap);
            } else {
                setRecap("Keep pushing forward! Your effort is compounding.");
            }
            setIsLoadingRecap(false);
        };
        fetchRecap();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-2xl flex flex-col"
            hideHeader={true}
        >
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-500">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-800">History</h3>
                    <p className="text-slate-500 text-sm">Your activity over the last 7 days</p>
                </div>
            </div>

            {/* AI Summary Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-8 border border-purple-100/50">
                {isLoadingRecap ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating your AI weekly recap...
                    </div>
                ) : (
                    <p className="text-slate-700 font-medium italic">
                        "{recap || 'You are building great habits.'}"
                    </p>
                )}
            </div>

            {/* Bar Chart */}
            <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 px-4 pb-2 pt-8 relative">
                {/* Y-axis lines */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-8 pb-8 px-4 opacity-10">
                    <div className="w-full h-px bg-slate-900"></div>
                    <div className="w-full h-px bg-slate-900"></div>
                    <div className="w-full h-px bg-slate-900"></div>
                    <div className="w-full h-px bg-slate-900"></div>
                </div>

                {chartData.map((day, idx) => {
                    const createdHeight = `${(day.created / maxCount) * 100}%`;
                    const completedHeight = `${(day.completed / maxCount) * 100}%`;
                    const isToday = idx === 6;

                    return (
                        <div key={day.date} className="flex flex-col items-center flex-1 z-10">
                            {/* Bars container */}
                            <div className="h-48 w-full flex items-end justify-center gap-1.5 sm:gap-2 mb-3">
                                {/* Created Bar */}
                                <div className="w-3 sm:w-5 bg-slate-200 rounded-t-sm relative group cursor-pointer" style={{ height: createdHeight }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.created} Created
                                    </div>
                                </div>
                                {/* Completed Bar */}
                                <div className="w-3 sm:w-5 bg-green-400 rounded-t-sm relative group cursor-pointer" style={{ height: completedHeight }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.completed} Completed
                                    </div>
                                </div>
                            </div>
                            {/* X-axis Label */}
                            <div className="text-center">
                                <span className={cn(
                                    "text-xs font-medium",
                                    isToday ? "text-purple-600" : "text-slate-500"
                                )}>
                                    {isToday ? "Today" : day.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <span className="text-xs text-slate-500 font-medium">Tasks Created</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-xs text-slate-500 font-medium">Tasks Completed</span>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 shrink-0 text-right">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                    Close
                </button>
            </div>
        </Dialog>
    );
}
