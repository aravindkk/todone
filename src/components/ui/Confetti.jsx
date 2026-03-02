import { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';

export function Toast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-white px-6 py-4 rounded-full shadow-2xl border border-green-100 flex items-center gap-3">
                <div className="p-1.5 bg-green-100 text-green-600 rounded-full">
                    <PartyPopper className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-800">{message}</p>
            </div>
        </div>
    );
}

export function Confetti({ intensity = 'normal', onComplete }) {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    const count = intensity === 'heavy' ? 100 : 40;
    const pieces = Array.from({ length: count }).map((_, i) => {
        const color = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)];
        const left = Math.random() * 100 + '%';
        const top = -10 - Math.random() * 20 + '%';
        const delay = Math.random() * 0.5 + 's';
        const duration = 1 + Math.random() * 2 + 's';
        const scale = 0.5 + Math.random();

        return (
            <div
                key={i}
                className="absolute w-3 h-3 rounded-sm pointer-events-none"
                style={{
                    backgroundColor: color,
                    left,
                    top,
                    animation: `fall ${duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay} forwards`,
                    transform: `scale(${scale}) rotate(${Math.random() * 360}deg)`,
                }}
            />
        );
    });

    return (
        <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden" aria-hidden="true">
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
            {pieces}
        </div>
    );
}
