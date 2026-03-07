import React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Dialog({ isOpen, onClose, title, children, className, bodyClassName, hideHeader }) {
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Content */}
            <div className={cn(
                "relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col",
                className
            )}>
                {/* Absolute Close Button for consistent top-right placement */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/50 backdrop-blur-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Header */}
                {!hideHeader && title && (
                    <div className="flex items-center justify-between p-6 pb-2 shrink-0">
                        <h3 className="text-xl font-semibold text-slate-800 pr-8">{title}</h3>
                    </div>
                )}

                {/* Body */}
                <div className={cn(
                    "p-6 pt-2 flex-1 min-h-0 flex flex-col",
                    bodyClassName
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}
