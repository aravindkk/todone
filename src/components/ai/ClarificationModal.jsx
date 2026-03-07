import { useState } from "react";
import { MessageSquare, ArrowRight, Check, Plus } from "lucide-react";
import { Dialog } from "../ui/Dialog";
import { cn } from "../../lib/utils";

export function ClarificationModal({ isOpen, onClose, question, originalTask, suggestions = [], onRefine }) {
    const [value, setValue] = useState(originalTask);
    const [selectedSusp, setSelectedSusp] = useState([]);

    const handleToggle = (suggestion) => {
        if (selectedSusp.includes(suggestion.description)) {
            setSelectedSusp(prev => prev.filter(s => s !== suggestion.description));
        } else {
            setSelectedSusp(prev => [...prev, suggestion.description]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Return both the refined text (if changed) AND selected suggestions
        // The parent needs to handle this adaptable payload.
        // For simplicity, we'll chain them:
        // 1. If user typed a new task, add it.
        // 2. If user selected suggestions, add them.

        let tasksToAdd = [];
        if (value.trim() && value !== originalTask) {
            tasksToAdd.push(value);
        }

        // Add selected suggestions
        tasksToAdd = [...tasksToAdd, ...selectedSusp];

        // If nothing selected/changed, maybe just add original?
        if (tasksToAdd.length === 0) {
            tasksToAdd.push(value);
        }

        // We need to change the callback signature in Dashboard to accept an array
        // Or call it multiple times. Let's send an array or single string.
        onRefine(tasksToAdd);
        setSelectedSusp([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-lg"
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-500 shrink-0">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-1">Refine your task</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {question}
                        </p>
                    </div>
                </div>

                {/* Suggestions List */}
                {suggestions && suggestions.length > 0 && (
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100 max-h-60 overflow-y-auto">
                        <p className="text-sm font-medium text-slate-500 mb-2">Suggested micro-tasks:</p>
                        {suggestions.map((item, index) => (
                            <label
                                key={index}
                                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors"
                            >
                                <div className={cn(
                                    "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                    selectedSusp.includes(item.description)
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "border-slate-300 bg-white"
                                )}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedSusp.includes(item.description)}
                                        onChange={() => handleToggle(item)}
                                    />
                                    {selectedSusp.includes(item.description) && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1">
                                    <span className="text-slate-700 font-medium block">{item.description}</span>
                                    <span className="text-xs text-slate-400 font-medium mt-1 inline-block bg-slate-100 px-1.5 py-0.5 rounded">
                                        {item.estimatedMinutes} min
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Or write your own:
                        </label>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800"
                            placeholder="Type a specific task..."
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Tasks ({
                                (value.trim() && value !== originalTask ? 1 : 0) + selectedSusp.filter(Boolean).length
                            })
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
}
