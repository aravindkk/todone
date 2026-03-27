import { useState } from 'react';
import { Star, X } from 'lucide-react';

export function RatingPrompt({ onDismiss }) {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl p-4 mb-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-2">
                <button
                    onClick={handleDismiss}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pr-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-yellow-400 to-orange-400 flex items-center justify-center shrink-0 shadow-inner">
                    <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-slate-800 text-lg">Enjoying ClariTask?</h3>
                    <p className="text-slate-600 text-sm mt-0.5">
                        Your reviews help us grow and improve ClariTask for everyone.
                    </p>
                </div>
                <div className="shrink-0 mt-3 sm:mt-0 w-full sm:w-auto">
                    <a
                        href="https://chromewebstore.google.com/detail/todo/godphnjdefiplhmfcepkchdehmgjfadp/reviews?ref=store-rating"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-colors shadow-sm active:scale-95"
                        onClick={handleDismiss} // Dismiss automatically after clicking to rate
                    >
                        Rate on Web Store
                    </a>
                </div>
            </div>
        </div>
    );
}
