import { useState, useEffect } from "react";
import { Check, ArrowLeft } from "lucide-react";

export function FocusMode({ task, onComplete, onExit }) {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col items-center justify-center p-8 z-50">
            <button
                onClick={onExit}
                className="absolute top-8 left-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <div className="text-center max-w-3xl">
                <div className="text-[120px] font-thin leading-none tracking-tight mb-12 font-mono tabular-nums opacity-90">
                    {formatTime(timeLeft)}
                </div>

                <h2 className="text-4xl font-bold mb-16 leading-tight">
                    {task.description}
                </h2>

                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={() => {
                            onComplete();
                            onExit();
                        }}
                        className="group flex items-center gap-3 px-8 py-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 rounded-full text-green-400 hover:text-green-300 transition-all text-lg font-medium"
                    >
                        <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                            <Check className="w-4 h-4" />
                        </div>
                        Complete Task
                    </button>

                    <button
                        onClick={onExit}
                        className="text-slate-500 hover:text-slate-300 transition-colors text-sm underline underline-offset-4"
                    >
                        Take a Break
                    </button>
                </div>
            </div>
        </div>
    );
}
