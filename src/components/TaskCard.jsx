import { useState } from "react";
import { Check, Pin, Trash2, Edit2, CalendarArrowUp, GripVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function TaskCard({ task, onComplete, onPin, onDelete, onEdit, onMove, index, showDate, showDragHandle }) {
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
        touchAction: 'none' // Prevent scrolling on touch devices while dragging
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 mb-3 transition-all duration-200",
                "hover:shadow-md hover:border-slate-200",
                task.pinned && "border-l-4 border-l-primary",
                isDragging && "z-50 shadow-xl scale-[1.02]"
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
                            "font-medium text-slate-700 select-none",
                            task.completed && "line-through text-slate-400"
                        )}>
                            {task.description}
                        </span>
                        {task.pinned && (
                            <Pin className="w-3.5 h-3.5 text-primary fill-primary/10 rotate-45" />
                        )}
                    </div>
                    {showDate && task.scheduledDate && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            {new Date(task.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isMoved && (
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        Moved {task.moveCount}x
                    </span>
                )}

                <div className={cn(
                    "flex items-center gap-1 transition-opacity duration-200",
                    isHovered || isDragging ? "opacity-100" : "opacity-0"
                )}>
                    <button
                        onClick={() => onPin(task.id)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
                        title={task.pinned ? "Unpin" : "Pin to top"}
                    >
                        <Pin className={cn("w-4 h-4", task.pinned && "fill-current")} />
                    </button>

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
