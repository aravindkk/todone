import React from 'react';
import { Sun, X } from 'lucide-react';

export function DailyRecapModal({ isOpen, onClose, recapText }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Sun className="w-5 h-5" />
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">Good Morning!</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {recapText}
                </p>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors w-full"
                    >
                        Let's Go!
                    </button>
                </div>
            </div>
        </div>
    );
}
