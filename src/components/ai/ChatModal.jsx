import { useState, useRef, useEffect } from "react";
import { Dialog } from "../ui/Dialog";
import { Send, MessageCircle, User, Loader2, Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

export function ChatModal({ isOpen, onClose, task, onSend, history, loading, onAddTask }) {
    const [input, setInput] = useState("");
    const [addedTasks, setAddedTasks] = useState(new Set());
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !loading) {
            const userMsg = input.trim().toLowerCase();

            // Bug 27: Detect "add tasks" intent
            const lastMessage = history[history.length - 1];
            if (
                lastMessage &&
                lastMessage.role === 'assistant' &&
                lastMessage.suggestedTasks &&
                lastMessage.suggestedTasks.length > 0 &&
                (userMsg.includes("add them") || userMsg.includes("add these") || userMsg.includes("add task") || userMsg.includes("create task"))
            ) {
                // Add all suggested tasks from the last message
                lastMessage.suggestedTasks.forEach(t => {
                    if (!addedTasks.has(t.description)) {
                        onAddTask(t.description);
                        setAddedTasks(prev => {
                            const newSet = new Set(prev);
                            newSet.add(t.description);
                            return newSet;
                        });
                    }
                });
                // Send a confirmation message instead of standard API call
                onSend(input.trim(), true); // We will need to modify Dashboard.jsx to handle this silent flag or just let it send
            } else {
                onSend(input.trim());
            }

            setInput("");
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-2xl h-[80vh] flex flex-col overflow-hidden"
            bodyClassName="p-0"
            hideHeader={true}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate max-w-[280px]" title={task.description}>
                            Help with: {task.description}
                        </h3>
                        <p className="text-xs text-slate-500">
                            ClariTask Coach
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
                {history.length === 0 && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-center font-medium">How can I help you with this task?</p>
                        <p className="text-sm text-center mt-2 opacity-70">
                            I can break it down, suggest ideas, or write a draft.
                        </p>
                    </div>
                )}

                {/* Render Task Description */}
                {task && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 font-medium">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Task</span>
                        {task.description}
                    </div>
                )}

                {history.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex gap-3 max-w-[85%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className={cn(
                                "p-3 rounded-2xl text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-slate-800 text-white rounded-tr-none"
                                    : "bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none"
                            )}>
                                {msg.content}
                            </div>
                            {/* Render Suggested Tasks */}
                            {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                                <div className="flex flex-col gap-2 mt-1">
                                    {msg.suggestedTasks.map((task, taskIdx) => {
                                        const isAdded = addedTasks.has(task.description);
                                        return (
                                            <button
                                                key={taskIdx}
                                                onClick={() => {
                                                    if (!isAdded) {
                                                        onAddTask(task.description);
                                                        setAddedTasks(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.add(task.description);
                                                            return newSet;
                                                        });
                                                    }
                                                }}
                                                disabled={isAdded}
                                                className={cn(
                                                    "text-left text-xs border p-3 rounded-xl shadow-sm transition-all flex items-center justify-between group",
                                                    isAdded
                                                        ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                                                        : "bg-white border-blue-200 hover:bg-blue-50 text-slate-700"
                                                )}
                                            >
                                                <span className="font-medium">{task.description}</span>
                                                {isAdded ? (
                                                    <span className="text-green-600 font-bold text-[10px] uppercase flex items-center gap-1">
                                                        ADDED <Check className="w-3 h-3" />
                                                    </span>
                                                ) : (
                                                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">+ Add</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        disabled={loading}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </Dialog >
    );
}
