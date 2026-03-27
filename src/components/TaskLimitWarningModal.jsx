import { Dialog } from "./ui/Dialog";
import { AlertCircle } from "lucide-react";

export function TaskLimitWarningModal({ isOpen, onClose, onProceed }) {
    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-sm"
        >
            <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-orange-50 rounded-2xl text-orange-500 mb-2">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">That's a full day already.</h3>
                <p className="text-slate-600 text-sm px-2">
                    You've got <span className="font-semibold text-slate-800">5 solid tasks</span> lined up — that's a focused, meaningful day.
                    <br /><br />
                    Adding more risks spreading yourself thin. Still want to add this one?
                </p>
                <div className="w-full pt-4 flex gap-3">
                    <button
                        onClick={onProceed}
                        className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                        Yes, add it
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
