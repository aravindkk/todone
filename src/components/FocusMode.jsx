import { useState, useEffect, useRef } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import { analytics } from "../services/analytics";

export function FocusMode({ task, initialDuration, onComplete, onExit }) {
    // If initialDuration is passed (e.g. 5 from intervention), use it, otherwise default to 25
    const [timeLeft, setTimeLeft] = useState(initialDuration ? initialDuration * 60 : 25 * 60);
    const [isActive, setIsActive] = useState(initialDuration ? true : false);

    // Store the actually selected duration to pass to analytics (defaults to initial or 25)
    const selectedDurationRef = useRef(initialDuration || 25);
    // Worker reference to clean up
    const workerRef = useRef(null);
    // Store target end time
    const targetTimeRef = useRef(null);
    // Expose stopAlarm so the Dismiss button can call it
    const stopAlarmRef = useRef(null);

    // Bug 42: Cleanly render URLs in the task title header
    const renderDescription = (text) => {
        if (!text) return null;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 underline underline-offset-2 break-all font-semibold"
                        onClick={(e) => e.stopPropagation()}
                    >
                        link
                    </a>
                );
            }
            return part;
        });
    };

    // Effect for handling the timer tick via Web Worker (Fix Bug 40)
    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            return;
        }

        // Calculate target end time using Date.now() when activating
        if (!targetTimeRef.current) {
            targetTimeRef.current = Date.now() + (timeLeft * 1000);
        }

        // Create an inline Web Worker. This guarantees ticks even when the Chrome tab is backgrounded.
        const workerCode = `
            let interval;
            self.onmessage = function(e) {
                if (e.data === 'start') {
                    interval = setInterval(() => self.postMessage('tick'), 500);
                } else if (e.data === 'stop') {
                    clearInterval(interval);
                }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        workerRef.current = worker;

        worker.onmessage = () => {
            if (!targetTimeRef.current) return;
            const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                setIsActive(false);
                worker.terminate();
                workerRef.current = null;
            }
        };

        worker.postMessage('start');

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, [isActive]); // Only re-run if active state changes, not every tick

    // Effect for handling Completion/Alarm sequence
    useEffect(() => {
        let titleInterval = null;

        if (!isActive && timeLeft === 0 && targetTimeRef.current) {
            // Timer just legitimately hit 0 (targetTimeRef ensures it wasn't just initialized to 0)
            targetTimeRef.current = null; // Consume the completion

            // Track completion
            analytics.trackFocusSessionFinished(selectedDurationRef.current);

            // Fix Bug 30: Scrolling Title
            const alertText = " ⏰ TIMER DONE!  ⏰  TIME TO TAKE A BREAK!  ";
            let offset = 0;
            titleInterval = setInterval(() => {
                document.title = alertText.substring(offset) + alertText.substring(0, offset);
                offset = (offset + 1) % alertText.length;
            }, 250);

            // Fix Bug 30: Robust Audio (Web Audio API instead of data URI)
            // This avoids 'NotSupportedError' entirely
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let isAlarming = true;

            const playBeep = () => {
                if (!isAlarming || !audioCtx) return;

                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note

                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.2);

                // Play twice in quick succession then pause
                setTimeout(() => {
                    if (!isAlarming || !audioCtx) return;
                    const osc2 = audioCtx.createOscillator();
                    const gain2 = audioCtx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
                    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                    gain2.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
                    gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
                    osc2.start(audioCtx.currentTime);
                    osc2.stop(audioCtx.currentTime + 0.2);
                }, 300);

                if (isAlarming) {
                    setTimeout(playBeep, 1500); // Repeat every 1.5s
                }
            };

            // Start the beep sequence
            playBeep();

            // Cleanup function for stopping alarm
            const stopAlarm = () => {
                isAlarming = false;
                if (audioCtx) {
                    audioCtx.close();
                    audioCtx = null;
                }
                if (titleInterval) clearInterval(titleInterval);
                document.title = "ClariTask - AI Todo Coach";
                window.removeEventListener('keydown', stopAlarm);
                stopAlarmRef.current = null;
            };

            stopAlarmRef.current = stopAlarm;
            window.addEventListener('keydown', stopAlarm);

            // Cleanup on unmount if component is removed while alarming
            return () => {
                stopAlarm();
            };
        }

        return () => {
            if (titleInterval) clearInterval(titleInterval);
            document.title = "ClariTask - AI Todo Coach";
        };
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white flex flex-col z-50 overflow-hidden animate-in fade-in duration-500">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none" />

            {/* Top bar */}
            <div className="shrink-0 flex items-center px-6 pt-5 pb-2 z-10">
                <button
                    onClick={onExit}
                    className="text-slate-400 hover:text-white transition-all flex items-center gap-2 bg-white/5 hover:bg-white/10 py-2 px-4 rounded-full backdrop-blur-md border border-white/10 shadow-lg text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            </div>

            {/* Task title */}
            <div className="shrink-0 w-full max-w-2xl mx-auto text-center px-6 py-4 z-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-white/70 leading-snug break-words tracking-tight drop-shadow-sm">
                    {renderDescription(task.description)}
                </h2>
            </div>

            {/* Timer + controls */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 z-10 w-full max-w-md mx-auto px-6 pb-6">
                {/* Duration picker */}
                <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full backdrop-blur-xl border border-white/10 shadow-xl">
                    {[5, 10, 25].map(min => (
                        <button
                            key={min}
                            onClick={() => {
                                targetTimeRef.current = null;
                                setTimeLeft(min * 60);
                                selectedDurationRef.current = min;
                                setIsActive(false);
                            }}
                            className={cn(
                                "px-6 py-2 rounded-full font-semibold transition-all duration-300",
                                timeLeft === min * 60
                                    ? "bg-white text-indigo-950 shadow-md transform scale-105"
                                    : "bg-transparent text-slate-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {min}m
                        </button>
                    ))}
                </div>

                {/* Timer display */}
                <div className="relative flex justify-center items-center w-full">
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-[64px] transition-opacity duration-1000",
                        isActive ? "opacity-100" : "opacity-0"
                    )} />
                    <div className={cn(
                        "text-[72px] sm:text-[96px] font-black leading-none tracking-tighter font-mono tabular-nums transition-colors duration-1000 relative z-10 drop-shadow-2xl",
                        !isActive && timeLeft === 0 ? "text-red-400 animate-pulse" : "text-white"
                    )}>
                        {timeLeft === 0 && !isActive ? "DONE" : formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex gap-4 w-full">
                    {timeLeft === 0 && !isActive ? (
                        <>
                            <button
                                onClick={() => {
                                    stopAlarmRef.current?.();
                                    onExit();
                                }}
                                className="flex-1 py-4 bg-white/10 text-slate-300 hover:bg-white/20 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 animate-pulse"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => {
                                    stopAlarmRef.current?.();
                                    onComplete();
                                    onExit();
                                }}
                                className="flex-1 group flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl transition-all shadow-lg shadow-emerald-500/20 border border-emerald-400/50 hover:border-emerald-300 active:scale-95 font-bold text-lg hover:scale-105"
                            >
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                Finish
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    if (isActive) {
                                        if (targetTimeRef.current) {
                                            const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
                                            setTimeLeft(remaining);
                                        }
                                        targetTimeRef.current = null;
                                        setIsActive(false);
                                    } else {
                                        targetTimeRef.current = Date.now() + (timeLeft * 1000);
                                        setIsActive(true);
                                    }
                                }}
                                className={cn(
                                    "flex-1 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 border",
                                    isActive
                                        ? "bg-white/10 text-slate-300 hover:bg-white/20 border-white/10 hover:border-white/20 backdrop-blur-md"
                                        : "bg-white text-indigo-950 hover:bg-slate-50 border-white hover:scale-105"
                                )}
                            >
                                {isActive ? "Pause" : "Start"}
                            </button>

                            <button
                                onClick={() => {
                                    onComplete();
                                    onExit();
                                }}
                                className="flex-1 group flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl transition-all shadow-lg shadow-emerald-500/20 border border-emerald-400/50 hover:border-emerald-300 active:scale-95 font-bold text-lg hover:scale-105"
                            >
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                Finish
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={onExit}
                    className="text-slate-400 hover:text-white transition-colors text-sm font-medium tracking-wide uppercase"
                >
                    Take a Break
                </button>
            </div>
        </div>
    );
}
