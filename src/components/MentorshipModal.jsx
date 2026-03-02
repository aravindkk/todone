import { Dialog } from "./ui/Dialog";
import { Users, X } from "lucide-react";

export function MentorshipModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-sm"
        >
            <div className="flex flex-col items-center text-center gap-4">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 mb-2">
                    <Users className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Busy week?</h3>
                <p className="text-slate-600 text-sm px-2">
                    You've created a lot of tasks lately. It might help to pause and think:{" "}
                    <span className="font-semibold text-slate-800">Do you know anyone who can mentor or guide you on some of these?</span>
                </p>
                <div className="w-full pt-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-md active:scale-[0.98]"
                    >
                        Got it, thanks!
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
