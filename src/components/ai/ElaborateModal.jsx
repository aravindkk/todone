import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { Dialog } from "../ui/Dialog";

export function ElaborateModal({ isOpen, onClose, originalTask, elaboratePrompt, onSubmit }) {
    const [value, setValue] = useState(originalTask);

    useEffect(() => {
        if (isOpen) setValue(originalTask);
    }, [isOpen, originalTask]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value.trim());
            onClose();
        }
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
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500 shrink-0">
                        <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 mb-1">Can you be more specific?</h3>
                        <p className="text-slate-600 leading-relaxed">
                            {elaboratePrompt || "What exactly needs to happen for this to be done?"}
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 leading-relaxed">
                    People who can clearly picture the outcome of a task finish it <span className="font-semibold">40% more often</span>. A specific task gives your brain a target to aim for.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800"
                        placeholder="e.g. Send the Q1 budget summary to Sarah by 3pm"
                    />
                    <div className="flex gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm"
                        >
                            Add Task
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
