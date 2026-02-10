import { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { Dialog } from "./ui/Dialog";

export function EditTaskModal({ isOpen, onClose, initialTask, onSave }) {
    const [value, setValue] = useState(initialTask || "");

    useEffect(() => {
        setValue(initialTask || "");
    }, [initialTask]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onSave(value);
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
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-500 shrink-0">
                        <Edit2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800">Edit Task</h3>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Task Description
                        </label>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98]"
                        >
                            Save Changes
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
