import { useState, useMemo } from "react";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { aiService } from "../services/ai";
import { storage } from "../lib/storage";

const PAIN_POINTS = [
    { id: "scattered", emoji: "🌊", title: "Too many things at once", sub: "Feeling scattered and overwhelmed" },
    { id: "starting",  emoji: "🧱", title: "Hard to start",           sub: "Tasks feel too big to begin" },
    { id: "slipping",  emoji: "📅", title: "Things keep slipping",    sub: "Forgetting or delaying important work" },
    { id: "fresh",     emoji: "✨", title: "Starting fresh",          sub: "Just getting organized" },
];

export function NewUserOnboarding({ onComplete }) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [firstTask, setFirstTask] = useState("");
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [breakdown, setBreakdown] = useState(null);
    const [selected, setSelected] = useState([]);

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) setStep(3);
    };

    const handlePainPoint = async (id) => {
        await storage.set("claritask_pain_point", id);
        setStep(4);
    };

    const handleFirstTaskSubmit = async (e) => {
        e.preventDefault();
        if (!firstTask.trim()) return;
        setIsEvaluating(true);
        try {
            const result = await aiService.breakDownTask(firstTask.trim());
            if (result?.subtasks?.length) {
                const top3 = result.subtasks.slice(0, 3);
                setBreakdown({ ...result, subtasks: top3 });
                setSelected(top3.map(() => true));
            } else {
                onComplete(name.trim(), [firstTask.trim()]);
            }
        } catch {
            onComplete(name.trim(), [firstTask.trim()]);
        }
        setIsEvaluating(false);
    };

    const handleAddBreakdown = () => {
        const descriptions = breakdown.subtasks
            .filter((_, i) => selected[i])
            .map(t => t.description);
        onComplete(name.trim(), descriptions.length ? descriptions : [firstTask.trim()]);
    };

    const toggleSelected = (i) => {
        setSelected(prev => prev.map((v, idx) => idx === i ? !v : v));
    };

    // ── Step 1: Welcome ──────────────────────────────────────────────────────
    if (step === 1) {
        return (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="text-center animate-in fade-in duration-700 px-8">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <img src="/icons/icon128.png" className="w-12 h-12 rounded-xl shadow-2xl" alt="Claritask" />
                        <h1 className="text-4xl font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>Claritask</h1>
                    </div>
                    <p className="text-2xl text-slate-200 font-light mb-3 max-w-sm mx-auto leading-snug">
                        The mental weight of<br />unfinished tasks ends here.
                    </p>
                    <p className="text-slate-400 mb-14 text-sm">Your AI-powered focus coach</p>
                    <button
                        onClick={() => setStep(2)}
                        className="flex items-center gap-2 mx-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all shadow-xl text-lg group"
                    >
                        Get started
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        );
    }

    // ── Step 2: Name ─────────────────────────────────────────────────────────
    if (step === 2) {
        return (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50/50 p-8">
                <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-base mb-1 leading-relaxed">
                        Hi — I'm Claritask, your productivity coach.
                    </p>
                    <p className="text-slate-500 text-base mb-8 leading-relaxed">
                        I'll help you cut through the noise, focus on what matters, and actually get things done.
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">What should I call you?</h2>
                    <form onSubmit={handleNameSubmit} className="space-y-4">
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your name..."
                            autoFocus
                            className="w-full px-5 py-4 text-lg text-center bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-base"
                        >
                            Nice to meet you
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ── Step 3: Pain point ───────────────────────────────────────────────────
    if (step === 3) {
        return (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50/50 p-8 overflow-y-auto">
                <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">What brings you here, {name}?</h2>
                    <p className="text-slate-500 mb-8 text-sm">I'll use this to personalize how I coach you.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {PAIN_POINTS.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handlePainPoint(p.id)}
                                className="p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-left group"
                            >
                                <div className="text-2xl mb-2">{p.emoji}</div>
                                <div className="font-semibold text-slate-800 text-sm leading-tight mb-1 group-hover:text-blue-700">{p.title}</div>
                                <div className="text-xs text-slate-400 leading-snug">{p.sub}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Step 4a: First task input ────────────────────────────────────────────
    if (step === 4 && !breakdown) {
        return (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50/50 p-8">
                <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Let's start with one thing, {name}.</h2>
                    <p className="text-slate-500 mb-8 text-sm">What's the most important task on your plate right now?</p>
                    <form onSubmit={handleFirstTaskSubmit} className="space-y-4">
                        <textarea
                            value={firstTask}
                            onChange={e => setFirstTask(e.target.value)}
                            placeholder="e.g. Finish the Q2 report for my team..."
                            rows={3}
                            autoFocus
                            className="w-full px-5 py-4 text-base bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 shadow-sm resize-none"
                        />
                        <button
                            type="submit"
                            disabled={!firstTask.trim() || isEvaluating}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-base"
                        >
                            {isEvaluating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Thinking...
                                </>
                            ) : (
                                <>
                                    Let's do this
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                    <button
                        onClick={() => onComplete(name.trim(), [])}
                        className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        );
    }

    // ── Step 4b: Breakdown result ────────────────────────────────────────────
    if (step === 4 && breakdown) {
        return (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50/50 p-8 overflow-y-auto">
                <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Your first task</p>
                        <p className="text-slate-800 font-medium mb-5">{firstTask}</p>
                        <p className="text-sm text-slate-500 mb-3">Here's how I'd break it down:</p>
                        <div className="space-y-2">
                            {breakdown.subtasks.map((subtask, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleSelected(i)}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                        selected[i]
                                            ? "bg-blue-50 border-blue-300"
                                            : "bg-slate-50 border-transparent"
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                                        selected[i] ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"
                                    }`}>
                                        {selected[i] && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm text-slate-700">{subtask.description}</span>
                                        {subtask.estimatedMinutes && (
                                            <span className="ml-2 text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {subtask.estimatedMinutes} min
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-center text-sm text-slate-500 mb-4">
                        Good start, {name}. This is exactly the kind of task I can help with.
                    </p>
                    <button
                        onClick={handleAddBreakdown}
                        disabled={!selected.some(Boolean)}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Add {selected.filter(Boolean).length} task{selected.filter(Boolean).length !== 1 ? "s" : ""} to my list
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => onComplete(name.trim(), [firstTask.trim()])}
                        className="w-full mt-2 py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                    >
                        Just add the main task
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
