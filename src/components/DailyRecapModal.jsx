import React from 'react';
import { Sun } from 'lucide-react';
import { Dialog } from './ui/Dialog';

export function DailyRecapModal({ isOpen, onClose, recapText }) {
    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-sm p-6"
            hideHeader={true}
        >
            <div className="flex justify-between items-start mb-4 mt-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Sun className="w-5 h-5" />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-2">Good Morning!</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {recapText}
            </p>

            <div className="flex justify-end pt-2 text-right">
                <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors w-full shadow-md active:scale-[0.98]"
                >
                    Let's Go!
                </button>
            </div>
        </Dialog>
    );
}
