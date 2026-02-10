import { HeartHandshake } from "lucide-react";
import { Dialog } from "../ui/Dialog";

export function InterventionModal({ isOpen, onClose, task, intervention, onAction }) {
    if (!intervention) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-orange-50/95 backdrop-blur-xl border border-orange-100"
        >
            <div className="flex flex-col gap-6 text-center">
                <div className="mx-auto p-4 bg-orange-100 rounded-full text-orange-500 mb-2">
                    <HeartHandshake className="w-8 h-8" />
                </div>

                <div>
                    <h3 className="text-2xl font-semibold text-slate-800 mb-2">Feeling stuck?</h3>
                    <p className="text-slate-600 text-lg">
                        You've moved "{task.description}" {task.moveCount} times. <br />
                        <span className="font-medium text-orange-600">No judgement!</span>
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Suggested Micro-Action</p>
                    <p className="text-xl text-slate-800 font-medium leading-snug">
                        {intervention.suggestedAction}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onAction();
                            onClose();
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                        Start 2-min Timer
                    </button>

                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-sm font-medium py-2"
                    >
                        I'll handle it myself
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
