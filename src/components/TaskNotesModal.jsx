import { useState } from "react";
import { MessageSquarePlus, CheckCircle2 } from "lucide-react";
import { Dialog } from "./ui/Dialog";

export function TaskNotesModal({ isOpen, onClose, task, type, onSave }) {
    const [notes, setNotes] = useState("");

    if (!isOpen || !task) return null;

    const isCompletion = type === "completion";

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(task.id, notes);
        setNotes("");
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-lg"
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${isCompletion ? 'bg-green-50 text-green-500' : 'bg-orange-50 text-orange-500'}`}>
                        {isCompletion ? <CheckCircle2 className="w-6 h-6" /> : <MessageSquarePlus className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">
                            {isCompletion ? "Task Completed!" : "Need a hand?"}
                        </h3>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm font-medium text-slate-700">{task.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {isCompletion
                                ? "This task was open for a while. What or who helped you finally get it done?"
                                : "This task has been open for a while. Who can help you with this?"}
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={isCompletion ? "Mention resources or people..." : "Tag a coworker, friend, or reference..."}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800 min-h-[100px] resize-y"
                            autoFocus
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            We'll save this in your notes so the AI can remind you next time you face a similar task.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98]"
                        >
                            Save Note
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Skip
                        </button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
}
