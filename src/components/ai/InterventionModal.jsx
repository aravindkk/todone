import { useState } from "react";
import { HeartHandshake, Check, Timer } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { cn } from "../../lib/utils";

export function InterventionModal({ isOpen, onClose, task, intervention, onAction, onAddTask }) {
    const [addedTasks, setAddedTasks] = useState(new Set());

    if (!intervention) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-orange-50/95 backdrop-blur-xl border border-orange-100"
            bodyClassName="p-4 sm:p-5" // Fix Bug 35: Reduce the massive default p-6 padding on modal body
        >
            <div className="flex flex-col gap-3 text-center">
                <div className="mx-auto p-2 bg-orange-100 rounded-full text-orange-500 mb-1">
                    <HeartHandshake className="w-5 h-5" />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Feeling stuck?</h3>
                    <p className="text-slate-600 text-sm">
                        You've moved "{task.description}" {task.moveCount} times. <br />
                        <span className="font-medium text-orange-600">No judgement!</span>
                    </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-orange-100 shadow-sm text-left">
                    <p className="text-slate-700 text-sm italic mb-2">
                        {intervention.empathyStatement}
                    </p>

                    {intervention.suggestedTasks && intervention.suggestedTasks.length > 0 && (
                        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Make it smaller</p>
                            {intervention.suggestedTasks.map((st, idx) => {
                                const isAdded = addedTasks.has(st.description);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (!isAdded) {
                                                if (typeof onAddTask === 'function') {
                                                    onAddTask(st.description);
                                                    setAddedTasks(prev => new Set([...prev, st.description]));
                                                } else {
                                                    console.error("onAddTask is not a function!");
                                                }
                                            }
                                        }}
                                        disabled={isAdded}
                                        className={cn(
                                            "text-left text-xs border p-2 rounded-lg shadow-sm transition-all flex items-center justify-between group",
                                            isAdded
                                                ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                                                : "bg-orange-50/50 border-orange-200 hover:bg-orange-100 text-slate-700"
                                        )}
                                    >
                                        <span className="font-medium">{st.description}</span>
                                        {isAdded ? (
                                            <span className="text-green-600 font-bold text-[10px] uppercase flex items-center gap-1">
                                                ADDED <Check className="w-3 h-3" />
                                            </span>
                                        ) : (
                                            <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs whitespace-nowrap ml-2">+ Add</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 mt-1">
                    <button
                        onClick={() => {
                            onAction(5); // Start 5-min timer
                            onClose();
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <Timer className="w-4 h-4" />
                        Start 5-min Timer
                    </button>

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-medium py-2 rounded-xl"
                    >
                        I'll handle it myself
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
