import { useState, useEffect } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

export function FocusMode({ task, onComplete, onExit }) {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false); // Fix Bug 25: Auto-start false

    useEffect(() => {
        let interval = null;
        let titleInterval = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);

            // Fix Bug 30: Flashing Title
            let flashState = false;
            titleInterval = setInterval(() => {
                document.title = flashState ? "🔴 TIME'S UP!" : "⏰ Timer Done!";
                flashState = !flashState;
            }, 1000);

            // Fix Bug 30: Robust Audio (Data URI)
            // Using a slightly longer, more distinct beep sequence for better attention
            const beep = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";
            const audio = new Audio(beep);
            audio.loop = true;

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio play failed:", error);
                    // Fallback visual only if audio fails
                });
            }

            // Cleanup function for stopping alarm
            const stopAlarm = () => {
                audio.pause();
                audio.currentTime = 0;
                if (titleInterval) clearInterval(titleInterval);
                document.title = "Todone";
                window.removeEventListener('click', stopAlarm);
                window.removeEventListener('keydown', stopAlarm); // Also stop on key press
            };

            window.addEventListener('click', stopAlarm);
            window.addEventListener('keydown', stopAlarm);

            // Cleanup on unmount if component is removed while alarming
            return () => {
                stopAlarm();
                if (interval) clearInterval(interval);
            };
        }

        return () => {
            if (interval) clearInterval(interval);
            if (titleInterval) clearInterval(titleInterval);
            document.title = "Todone";
        };
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

            <h2 className="text-4xl font-bold mb-12 leading-tight">
                {task.description}
            </h2>

            <div className="flex flex-col items-center gap-6">
                {/* Bug 25: Duration selection above/prominent */}
                <div className="flex items-center gap-3 mb-8">
                    {[5, 10, 25].map(min => (
                        <button
                            key={min}
                            onClick={() => {
                                setTimeLeft(min * 60);
                                setIsActive(true);
                            }}
                            className={cn(
                                "px-6 py-3 rounded-full font-medium transition-all border",
                                timeLeft === min * 60
                                    ? "bg-white text-slate-900 border-white scale-110 shadow-lg shadow-white/10"
                                    : "bg-transparent text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
                            )}
                        >
                            {min}m
                        </button>
                    ))}
                </div>

                <div className={cn(
                    "text-[120px] font-thin leading-none tracking-tight mb-8 font-mono tabular-nums opacity-90 transition-colors duration-1000",
                    !isActive && timeLeft === 0 ? "text-red-500 animate-pulse" : "text-white"
                )}>
                    {timeLeft === 0 && !isActive ? "TIME'S UP" : formatTime(timeLeft)}
                </div>

                <button
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                        "mb-12 px-8 py-3 rounded-full font-medium text-lg transition-all flex items-center gap-2 mx-auto",
                        isActive
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-white text-slate-900 hover:bg-slate-100"
                    )}
                >
                    {isActive ? "Pause Timer" : "Start Timer"}
                </button>

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
                    className="mt-8 text-slate-500 hover:text-slate-300 transition-colors text-sm underline underline-offset-4"
                >
                    Take a Break
                </button>
            </div>
        </div>
    );
}
