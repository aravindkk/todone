import { useState } from "react";
import { Dialog } from "./ui/Dialog";
import { Sparkles, ArrowRight } from "lucide-react";

export function OnboardingModal({ isOpen, onSave }) {
    const [name, setName] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 fill-current" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Todone!</h2>
                <p className="text-slate-500 mb-8">
                    Your personal AI productivity companion.
                    <br />
                    What should I call you?
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full px-4 py-3 text-lg text-center bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                        autoFocus
                    />

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    >
                        Let's Go
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
}
