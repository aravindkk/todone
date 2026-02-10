import { useState } from "react";
import { TaskInput } from "./TaskInput";
import { TaskCard } from "./TaskCard";
import { StreakCounter } from "./StreakCounter";
import { useTasks } from "../hooks/useTasks";
import { FocusMode } from "./FocusMode";
import { BreakdownModal } from "./ai/BreakdownModal";
import { InterventionModal } from "./ai/InterventionModal";
import { ClarificationModal } from "./ai/ClarificationModal";
import { aiService } from "../services/ai";
import { cn } from "../lib/utils";
import { Radio } from "lucide-react";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function Dashboard() {
    const { tasks, loading, addTask, addMultipleTasks, reorderTasks, completeTask, pinTask, deleteTask, updateTask } = useTasks();
    const [showAll, setShowAll] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // AI Modal State
    const [aiModal, setAiModal] = useState({ isOpen: false, type: null, data: null });
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Filter tasks: Show all tasks (active & completed)
    // Sort: Pinned first, then Pinned Completed(optional), then Active, then Completed
    // Simplified: Pinned -> Active -> Completed
    // Removed Chronological sort to support DnD reordering (relies on array order)
    const sortedTasks = [...tasks].sort((a, b) => {
        // 1. Pinned to top
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;

        // 2. Completed to bottom
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        return 0; // Preserve array order
    });

    // Date Helpers
    const normalizeDate = (d) => {
        const date = d ? new Date(d) : new Date();
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    };

    const today = normalizeDate(new Date());
    const tomorrow = normalizeDate(new Date(Date.now() + 86400000));

    const todayTasks = sortedTasks.filter(t => normalizeDate(t.scheduledDate) <= today);
    const tomorrowTasks = sortedTasks.filter(t => normalizeDate(t.scheduledDate) === tomorrow);
    const laterTasks = sortedTasks.filter(t => normalizeDate(t.scheduledDate) > tomorrow);

    const visibleTodayTasks = showAll ? todayTasks : todayTasks.slice(0, 5);
    const hiddenCount = todayTasks.length - 5;

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = tasks.findIndex((t) => t.id === active.id);
            const newIndex = tasks.findIndex((t) => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newTasks = arrayMove(tasks, oldIndex, newIndex);
                reorderTasks(newTasks);
            }
        }
    };

    const handleAddTask = async (description) => {
        setIsEvaluating(true);

        // 1. Evaluate Task
        const evaluation = await aiService.evaluateTask(description);

        // Handle API error or fallback
        if (evaluation.error) {
            addTask(description);
            setIsEvaluating(false);
            return;
        }

        // 2. If vague, ask for clarification (Modal)
        if (!evaluation.isSpecific) {
            setAiModal({
                isOpen: true,
                type: 'clarification',
                data: {
                    question: evaluation.clarificationQuestion || "Can you be more specific?",
                    originalTask: description,
                    suggestions: evaluation.suggestion // Pass AI suggestions (Array)
                }
            });
            setIsEvaluating(false);
            return;
        }

        // 3. If too big, suggest breakdown
        if (!evaluation.canCompleteInOneHour) {
            const breakdown = await aiService.breakDownTask(description);
            if (!breakdown.error) {
                setAiModal({
                    isOpen: true,
                    type: 'breakdown',
                    data: { originalTask: description, suggestion: breakdown }
                });
                setIsEvaluating(false);
                return;
            }
        }

        // 4. Default: Add valid task
        addTask(description);
        setIsEvaluating(false);
    };

    const handleEdit = (id) => {
        const task = tasks.find(t => t.id === id);
        const newDesc = prompt("Update task:", task.description);
        if (newDesc && newDesc.trim()) {
            updateTask(id, { description: newDesc });
        }
    };

    const handleMove = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const currentScheduled = task.scheduledDate ? new Date(task.scheduledDate) : new Date();
        const nextDay = new Date(currentScheduled);
        nextDay.setDate(nextDay.getDate() + 1);

        const newCount = (task.moveCount || 0) + 1;
        updateTask(id, {
            moveCount: newCount,
            scheduledDate: nextDay.toISOString()
        });

        // AI Intervention for Stuck Tasks (Moved 3+ times)
        if (newCount >= 3) {
            const intervention = await aiService.getStuckIntervention(
                task.description,
                3, // Mock days stuck
                newCount
            );

            if (!intervention.error) {
                setAiModal({
                    isOpen: true,
                    type: 'intervention',
                    data: { task, intervention }
                });
            }
        }
    };

    const handleAcceptBreakdown = (subtasks) => {
        // Add all subtasks
        subtasks.forEach(st => addTask(st.description)); // Adds each as a separate task
    };

    const handleRefineTask = (refinedResult) => {
        if (Array.isArray(refinedResult)) {
            addMultipleTasks(refinedResult);
        } else {
            addTask(refinedResult);
        }
        setAiModal({ ...aiModal, isOpen: false });
    };

    const currentFocusTask = sortedTasks[0]; // Top task is the focus

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    if (isFocusMode && currentFocusTask) {
        return (
            <FocusMode
                task={currentFocusTask}
                onComplete={() => completeTask(currentFocusTask.id)}
                onExit={() => setIsFocusMode(false)}
            />
        );
    }

    const TaskList = ({ tasks, title, emptyMsg, showDate, isSortable }) => (
        <div className="mb-8 last:mb-0">
            {title && (
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">{title}</h3>
            )}
            <div className="space-y-1">
                {tasks.map((task, index) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onComplete={completeTask}
                        onPin={pinTask}
                        onDelete={deleteTask}
                        onEdit={handleEdit}
                        onMove={handleMove}
                        showDate={showDate}
                        showDragHandle={isSortable && !task.pinned && !task.completed}
                    />
                ))}
                {tasks.length === 0 && emptyMsg && (
                    <div className="text-center py-6 text-slate-400 bg-white/30 rounded-xl border border-dashed border-slate-200">
                        <p>{emptyMsg}</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50/50 p-8 font-sans text-slate-900 transition-colors duration-500 overflow-y-auto">
            <div className="max-w-2xl mx-auto pb-20">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Todone</h1>
                    <div className="flex items-center gap-4">
                        {tasks.some(t => !t.completed) && (
                            <button
                                onClick={() => setIsFocusMode(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all font-medium text-sm"
                            >
                                <Radio className="w-4 h-4" />
                                Focus Mode
                            </button>
                        )}
                        <StreakCounter streak={12} /> {/* Placeholder streak */}
                    </div>
                </div>

                {/* Input */}
                <TaskInput onAddTask={handleAddTask} isEvaluating={isEvaluating} />

                {/* Sections */}
                <div className="mt-8">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={visibleTodayTasks.filter(t => !t.pinned && !t.completed).map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <TaskList
                                tasks={visibleTodayTasks}
                                title="Today"
                                emptyMsg={tomorrowTasks.length === 0 && laterTasks.length === 0 ? "No tasks yet. You're free!" : "No tasks for today."}
                                isSortable={true}
                            />
                        </SortableContext>
                    </DndContext>

                    {/* Show More Button for Today */}
                    {!showAll && hiddenCount > 0 && (
                        <div className="mt-4 mb-8 text-center">
                            <button
                                onClick={() => setShowAll(true)}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:bg-white"
                            >
                                Show {hiddenCount} more
                            </button>
                        </div>
                    )}
                    {showAll && todayTasks.length > 5 && (
                        <div className="mt-4 mb-8 text-center">
                            <button
                                onClick={() => setShowAll(false)}
                                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Show less
                            </button>
                        </div>
                    )}

                    {tomorrowTasks.length > 0 && (
                        <TaskList tasks={tomorrowTasks} title="Tomorrow" showDate />
                    )}

                    {laterTasks.length > 0 && (
                        <TaskList tasks={laterTasks} title="Later" showDate />
                    )}
                </div>
            </div>

            {/* AI Modals */}
            {aiModal.type === 'breakdown' && (
                <BreakdownModal
                    isOpen={aiModal.isOpen}
                    onClose={() => setAiModal({ ...aiModal, isOpen: false })}
                    originalTask={aiModal.data.originalTask}
                    suggestion={aiModal.data.suggestion}
                    onAccept={handleAcceptBreakdown}
                />
            )}

            {aiModal.type === 'clarification' && (
                <ClarificationModal
                    isOpen={aiModal.isOpen}
                    onClose={() => setAiModal({ ...aiModal, isOpen: false })}
                    question={aiModal.data.question}
                    originalTask={aiModal.data.originalTask}
                    suggestions={aiModal.data.suggestions}
                    onRefine={handleRefineTask}
                />
            )}

            {aiModal.type === 'intervention' && (
                <InterventionModal
                    isOpen={aiModal.isOpen}
                    onClose={() => setAiModal({ ...aiModal, isOpen: false })}
                    task={aiModal.data.task}
                    intervention={aiModal.data.intervention}
                    onAction={() => {
                        // Start a timer? For now just close, user can use focus mode
                        setIsFocusMode(true);
                    }}
                />
            )}
        </div>
    );
}
