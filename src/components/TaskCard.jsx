import { useState, useEffect } from "react";
import { Check, Pin, Trash2, Edit2, CalendarArrowUp, GripVertical, Play, Pause, Timer, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function TaskCard({
    task,
    index,
    onComplete,
    onPin,
    onDelete,
    onEdit,
    onMove,
    onChat,
    onToggleTimer,
    onStartTimer,
    onFocusTask,
    showDate,
    showDragHandle = true,
    isFocusing = false, // The selected task
    isNotFocusing = false // All other tasks fading out
}) {
    const [isHovered, setIsHovered] = useState(false);
    const isMoved = task.moveCount > 0;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled: !showDragHandle
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    // Bug 41: Allow links in task text
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

    const formatTimeOpen = (startStr, endStr) => {
        if (!startStr || !endStr) return null;
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffMs = end - start;
        if (diffMs < 0) return null;

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays >= 60) return `${Math.floor(diffDays / 30)} months`;
        if (diffDays >= 30) return `1 month`;
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        if (diffMinutes > 0) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;
        return 'Just now';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm transition-all relative overflow-hidden",
                !task.completed && "hover:shadow-md hover:border-blue-100",
                task.completed && "bg-slate-50/50 opacity-75 grayscale-[0.2]",
                isDragging && "opacity-50 blur-[1px] shadow-lg border-blue-200 scale-100",
                task.isRunning && "border-orange-200 shadow-orange-100/50 ring-1 ring-orange-100",
                task.pinned && "border-blue-100 shadow-blue-50/50",
                isFocusing && "z-50 scale-105 shadow-2xl border-blue-400 bg-blue-50/20 ring-4 ring-blue-500/20 duration-500 ease-out translate-y-2",
                isNotFocusing && "opacity-0 scale-95 blur-sm translate-y-8 duration-500 ease-in pointer-events-none"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-3 flex-1">
                {showDragHandle && (
                    <button
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors -ml-1"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                )}

                <button
                    onClick={() => onComplete(task.id)}
                    className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                        task.completed
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-slate-300 text-transparent hover:border-green-500 hover:text-green-500"
                    )}
                >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-medium text-slate-700",
                            task.completed && "text-slate-400"
                        )}>
                            {renderDescription(task.description)}
                        </span>
                        {task.pinned && (
                            <Pin className="w-3.5 h-3.5 text-primary fill-primary/10 rotate-45" />
                        )}
                    </div>
                    {task.completed && task.createdAt && task.completedAt && (
                        <span className="text-[11px] text-slate-400 mt-0.5 tracking-wide">
                            Completed in {formatTimeOpen(task.createdAt, task.completedAt)}
                        </span>
                    )}
                    {showDate && task.scheduledDate && !task.completed && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            {new Date(task.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Timer Control */}
                {!task.completed && (
                    <div className={cn(
                        "flex items-center gap-1.5 mr-2 transition-all",
                        isHovered ? "opacity-100" : "opacity-0"
                    )}>
                        <button
                            onClick={() => onFocusTask(task.id)}
                            className="p-1.5 rounded-full transition-colors bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600"
                            title="Open Focus Mode"
                        >
                            <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                    </div>
                )}

                {isMoved && (
                    task.moveCount >= 3 ? (
                        <button
                            onClick={() => onChat && onChat(task.id)}
                            className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 hover:bg-orange-200 transition-colors"
                            title="Stuck? AI can help"
                        >
                            Stuck? AI can help →
                        </button>
                    ) : (
                        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            Moved {task.moveCount}x
                        </span>
                    )
                )}

                <div className={cn(
                    "flex items-center gap-1 transition-opacity duration-200",
                    isHovered || isDragging ? "opacity-100" : "opacity-0"
                )}>
                    <button
                        onClick={() => onPin(task.id)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                        title={task.pinned ? "Undo importance" : "Mark as important"}
                    >
                        <Pin className={cn("w-4 h-4", task.pinned && "fill-current")} />
                    </button>

                    {!task.completed && (
                        <>
                            <button
                                onClick={() => onEdit(task.id)}
                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => onMove(task.id)}
                                className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                                title="Move to tomorrow"
                            >
                                <CalendarArrowUp className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => onChat(task.id)}
                                className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-md transition-colors"
                                title="Ask AI for help"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
