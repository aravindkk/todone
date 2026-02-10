import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { cn } from "../../lib/utils";

export function BreakdownModal({ isOpen, onClose, originalTask, suggestion, onAccept }) {
    const [selectedSubtasks, setSelectedSubtasks] = useState(
        suggestion?.subtasks?.map(() => true) || []
    );

    if (!suggestion) return null;

    const handleToggle = (index) => {
        setSelectedSubtasks(prev => {
            const next = [...prev];
            next[index] = !next[index];
            return next;
        });
    };

    const handleAccept = () => {
        const subtasksToAdd = suggestion.subtasks.filter((_, i) => selectedSubtasks[i]);
        onAccept(subtasksToAdd);
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20"
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-1">Let's make this doable</h3>
                        <p className="text-slate-600 leading-relaxed">
                            "{originalTask}" feels big! How about breaking it down into 1-hour chunks?
                        </p>
                    </div>
                </div>

                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    {suggestion.subtasks.map((subtask, index) => (
                        <label
                            key={index}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors"
                        >
                            <div className={cn(
                                "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                selectedSubtasks[index]
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "border-slate-300 bg-white"
                            )}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedSubtasks[index]}
                                    onChange={() => handleToggle(index)}
                                />
                                {selectedSubtasks[index] && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1">
                                <span className="text-slate-700 font-medium block">{subtask.description}</span>
                                <span className="text-xs text-slate-400 font-medium mt-1 inline-block bg-slate-100 px-1.5 py-0.5 rounded">
                                    {subtask.estimatedMinutes} min
                                </span>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleAccept}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98]"
                    >
                        Use Breakdown
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        No thanks
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
