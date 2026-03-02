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
                document.title = "Todo";
                window.removeEventListener('click', stopAlarm);
                window.removeEventListener('keydown', stopAlarm); // Also stop on key press
            };

            window.addEventListener('click', stopAlarm);
            window.addEventListener('keydown', stopAlarm);

            // Cleanup on unmount if component is removed while alarming
            return () => {
                stopAlarm();
            };
        }

        return () => {
            if (titleInterval) clearInterval(titleInterval);
            document.title = "Todo";
        };
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-[#0f172a] text-white flex flex-col items-center pt-24 pb-8 px-6 md:px-8 z-50 overflow-y-auto w-full h-full">
            <button
                onClick={onExit}
                className="fixed top-8 left-6 md:left-8 text-slate-400 hover:text-white transition-colors flex items-center gap-2 z-50 bg-[#0f172a]/80 py-2 px-4 rounded-full backdrop-blur-sm"
            >
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            <div className="w-full max-w-3xl mx-auto text-center mt-auto mb-8 sm:mb-12 shrink-0">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight break-words">
                    {renderDescription(task.description)}
                </h2>
            </div>

            <div className="flex flex-col items-center gap-6 shrink-0 mb-auto">
                {/* Bug 25: Duration selection above/prominent */}
                <div className="flex items-center gap-3 mb-8">
                    {[5, 10, 25].map(min => (
                        <button
                            key={min}
                            onClick={() => {
                                targetTimeRef.current = null; // Reset target end time on new selection
                                setTimeLeft(min * 60);
                                selectedDurationRef.current = min;
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
                    onClick={() => {
                        if (isActive) {
                            // Pausing: recalculate exactly how much time is left and clear target
                            if (targetTimeRef.current) {
                                const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
                                setTimeLeft(remaining);
                            }
                            targetTimeRef.current = null;
                            setIsActive(false);
                        } else {
                            // Starting/Resuming: establish a new target time
                            targetTimeRef.current = Date.now() + (timeLeft * 1000);
                            setIsActive(true);
                        }
                    }}
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
