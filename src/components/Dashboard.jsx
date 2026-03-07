import { useState, useEffect } from "react";
import { TaskInput } from "./TaskInput";
import { TaskCard } from "./TaskCard";
import { StreakCounter } from "./StreakCounter";
import { useTasks } from "../hooks/useTasks";
import { FocusMode } from "./FocusMode";
import { BreakdownModal } from "./ai/BreakdownModal";
import { InterventionModal } from "./ai/InterventionModal";
import { ClarificationModal } from "./ai/ClarificationModal";
import { EditTaskModal } from "./EditTaskModal";
import { OnboardingModal } from "./OnboardingModal";
import { AccomplishmentsModal } from "./AccomplishmentsModal";
import { DailyRecapModal } from "./DailyRecapModal";
import { FridaySummaryModal } from "./FridaySummaryModal";
import { ChatModal } from "./ai/ChatModal";
import { RatingPrompt } from "./RatingPrompt";
import { TaskNotesModal } from "./TaskNotesModal";
import { MentorshipModal } from "./MentorshipModal";
import { TaskLimitWarningModal } from "./TaskLimitWarningModal";
import { GamePlanModal } from "./GamePlanModal";
import { Confetti, Toast } from "./ui/Confetti";
import { aiService } from "../services/ai";
import { analytics } from "../services/analytics";
import { storage } from "../lib/storage";
import { cn } from "../lib/utils";
import { Activity, Clock, LogOut, CheckCircle2, ChevronDown, Calendar, LineChart, Target, Radio, ArrowRight, ListOrdered, Flame, Snowflake } from "lucide-react";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function Dashboard() {
    const { tasks, loading, addTask, addMultipleTasks, reorderTasks, completeTask, pinTask, deleteTask, updateTask, streak, toggleTimer, startTimer, userName, setUserName, installDate, getStats, hasRecentTasks } = useTasks();
    const [showAll, setShowAll] = useState(false);
    const [showCompleted, setShowCompleted] = useState(true);

    // Bug 53: Initialize showCompleted from storage
    useEffect(() => {
        const loadSettings = async () => {
            const savedSetting = await storage.get('todo_show_completed', true);
            setShowCompleted(savedSetting);
        };
        loadSettings();
    }, []);

    const toggleShowCompleted = async () => {
        const newValue = !showCompleted;
        setShowCompleted(newValue);
        await storage.set('todo_show_completed', newValue);
    };

    const [focusTaskId, setFocusTaskId] = useState(null); // Fix Bug 29: Specific task focus
    const [focusTaskDuration, setFocusTaskDuration] = useState(null); // Initial duration for Focus Mode
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [chatModal, setChatModal] = useState({
        isOpen: false,
        task: null,
        history: [],
        loading: false
    });

    // Rating Prompt Logic
    const [showRating, setShowRating] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState(null);

    // Bug 59: Game Plan Modal
    const [showGamePlan, setShowGamePlan] = useState(false);

    useEffect(() => {
        if (!installDate) return;
        const checkRatingMilestone = async () => {
            const dismissed = await storage.get('todo_dismissed_ratings', []);
            const install = new Date(installDate);
            const now = new Date();
            const daysDiff = Math.floor((now - install) / (1000 * 60 * 60 * 24));

            const milestones = [3, 7, 14, 30];
            const activeMilestone = milestones.find(m => daysDiff >= m && !dismissed.includes(m));

            if (activeMilestone) {
                setCurrentMilestone(activeMilestone);
                setShowRating(true);
            }
        };
        checkRatingMilestone();
    }, [installDate]);

    const handleDismissRating = async () => {
        setShowRating(false);
        const dismissed = await storage.get('todo_dismissed_ratings', []);
        if (currentMilestone) {
            await storage.set('todo_dismissed_ratings', [...dismissed, currentMilestone]);
        }
    };

    // Task Notes & Interventions (Feature 8)
    const [notesModal, setNotesModal] = useState({ isOpen: false, task: null, type: null });

    // Help Prompt (Feature 10)
    useEffect(() => {
        if (loading || tasks.length === 0) return;

        const checkHelpPrompt = async () => {
            const hasPrompted = await storage.get('todo_help_prompted', false);
            if (!hasPrompted) {
                const oldTasks = tasks.filter(t => !t.completed && t.createdAt && (new Date() - new Date(t.createdAt)) / (1000 * 60 * 60 * 24) > 3);
                if (oldTasks.length > 0 && Math.random() < 0.2) {
                    const randomTask = oldTasks[Math.floor(Math.random() * oldTasks.length)];
                    setNotesModal({ isOpen: true, task: randomTask, type: 'help' });
                }
                await storage.set('todo_help_prompted', true);
            }
        };
        checkHelpPrompt();
    }, [loading, tasks]);

    // Mentorship Prompt (Feature 11)
    const [showMentorship, setShowMentorship] = useState(false);

    // Celebration State (Feature 14)
    const [celebration, setCelebration] = useState(null);

    const formatDurationHuman = (ms) => {
        const diffDays = Math.floor(ms / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(ms / (1000 * 60 * 60));
        const diffMins = Math.floor(ms / (1000 * 60));

        if (diffDays >= 60) return `${Math.floor(diffDays / 30)} months`;
        if (diffDays >= 30) return `1 month`;
        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
        return 'seconds';
    };

    useEffect(() => {
        if (loading || tasks.length === 0) return;

        const checkMentorshipPrompt = async () => {
            const hasPrompted = await storage.get('todo_mentorship_prompted', false);
            if (!hasPrompted) {
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                const recentTasks = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= threeDaysAgo);

                if (recentTasks.length > 10) {
                    setShowMentorship(true);
                    // Bug 54: We only set prompted=true when explicitly dismissed, so it keeps showing
                    // until the user dismisses. Thus, remove the setItem here.
                }
            }
        };
        checkMentorshipPrompt();
    }, [loading, tasks]);

    const handleDismissMentorship = async () => {
        setShowMentorship(false);
        await storage.set('todo_mentorship_prompted', true);
    };

    // Sorting Prompt (Feature 16)
    const [showSortPrompt, setShowSortPrompt] = useState(false);

    useEffect(() => {
        if (loading) return;
        const checkSortPrompt = async () => {
            const openCount = tasks.filter(t => !t.completed).length;
            const hasSorted = await storage.get('todo_has_sorted', false);

            if (openCount >= 3 && !hasSorted) {
                setShowSortPrompt(true);
            } else {
                setShowSortPrompt(false);
            }
        };
        checkSortPrompt();
    }, [tasks, loading]);

    const handleDismissSortPrompt = async () => {
        setShowSortPrompt(false);
        await storage.set('todo_has_sorted', true);
    };

    // Feature 17: Daily AI Recap
    const [dailyRecap, setDailyRecap] = useState({ isOpen: false, text: "" });

    useEffect(() => {
        if (loading || !tasks.length) return;

        const checkDailyRecap = async () => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
            if (dayOfWeek === 0 || dayOfWeek === 6) return; // Skip weekends

            const todayStr = today.toLocaleDateString();
            const lastRecapDate = await storage.get('todo_last_recap_date', null);

            if (lastRecapDate === todayStr) return; // Already shown today

            // Find previous weekday
            const prev = new Date(today);
            let prevDays = 1;
            if (dayOfWeek === 1) prevDays = 3; // Monday -> Friday
            prev.setDate(prev.getDate() - prevDays);
            const prevStr = prev.toLocaleDateString();
            const prevDayName = prev.toLocaleDateString('en-US', { weekday: 'long' });

            // Filter tasks from previous weekday (created or completed on that day)
            const prevTasks = tasks.filter(t => {
                const createdDate = new Date(t.createdAt).toLocaleDateString();
                const completedDate = t.completedAt ? new Date(t.completedAt).toLocaleDateString() : null;
                return createdDate === prevStr || completedDate === prevStr;
            });

            const recapText = await aiService.getDailyRecap(prevTasks, prevDayName, userName);
            if (recapText && !recapText.error && !recapText.rateLimited) {
                setDailyRecap({ isOpen: true, text: recapText });
                await storage.set('todo_last_recap_date', todayStr);
            }
        };

        checkDailyRecap();
    }, [loading, tasks, userName]);

    // Feature 18: Friday Weekly Summary
    const [fridaySummary, setFridaySummary] = useState({ isOpen: false, stats: null });

    useEffect(() => {
        if (loading || !tasks.length) return;

        const checkFridaySummary = async () => {
            const today = new Date();
            if (today.getDay() !== 5) return; // Only show on Friday

            const todayStr = today.toLocaleDateString();
            const lastShown = await storage.get('todo_weekly_summary_shown', null);

            if (lastShown === todayStr) return; // Already shown this Friday

            // Calculate weekly stats
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 5); // Look back to Monday

            const completedThisWeek = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= weekAgo);

            let longestCompletedTask = null;
            let maxDuration = 0;

            completedThisWeek.forEach(t => {
                if (t.createdAt) {
                    const duration = new Date(t.completedAt) - new Date(t.createdAt);
                    if (duration > maxDuration) {
                        maxDuration = duration;
                        longestCompletedTask = t;
                    }
                }
            });

            setFridaySummary({
                isOpen: true,
                stats: {
                    completedThisWeek: completedThisWeek.length,
                    longestCompletedTask
                }
            });
            await storage.set('todo_weekly_summary_shown', todayStr);
        };

        checkFridaySummary();
    }, [loading, tasks]);

    const handleCompleteWrapper = (id) => {
        const task = tasks.find(t => t.id === id);
        completeTask(id);

        if (task && !task.completed && task.createdAt) {
            const ageMs = new Date() - new Date(task.createdAt);
            const ageDays = ageMs / (1000 * 60 * 60 * 24);

            // Celebration
            const humanDuration = formatDurationHuman(ageMs);
            const intensity = ageDays > 3 ? 'heavy' : 'normal';
            const message = `You crushed this in ${humanDuration}! ${ageDays > 3 ? 'Way to stick with it!' : 'Great job!'}`;

            setCelebration({ message, intensity });

            // Notes Prompt
            if (ageDays > 3) {
                setNotesModal({ isOpen: true, task, type: 'completion' });
            }
        }
    };

    const handleSaveNotes = (id, newNotes) => {
        const task = tasks.find(t => t.id === id);
        if (task && newNotes.trim()) {
            const prefix = notesModal.type === 'completion' ? 'Completion Note: ' : 'Help Note: ';
            const currentNotes = task.notes ? task.notes + '\n\n' : '';
            updateTask(id, { notes: currentNotes + prefix + newNotes });
        }
    };

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

    // Edit Modal State
    const [editModal, setEditModal] = useState({ isOpen: false, taskId: null, currentDescription: "", initialDate: null });

    // Feature 15 & Bug 46: Focus Mode Animation State
    const [focusingTaskId, setFocusingTaskId] = useState(null);

    // Track app open
    useEffect(() => {
        analytics.trackAppOpened();
    }, []);

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

    const todayTasks = sortedTasks.filter(t => {
        // Bug 52: If completed, must have been completed today to show in today's section
        if (t.completed && t.completedAt) {
            const completedDate = normalizeDate(t.completedAt);
            if (completedDate < today) return false;
        }
        return normalizeDate(t.scheduledDate) <= today && (showCompleted || !t.completed);
    });

    const tomorrowTasks = sortedTasks.filter(t => normalizeDate(t.scheduledDate) === tomorrow && (showCompleted || !t.completed));
    const laterTasks = sortedTasks.filter(t => normalizeDate(t.scheduledDate) > tomorrow && (showCompleted || !t.completed));

    const visibleTodayTasks = showAll ? todayTasks : todayTasks.slice(0, 5);
    const visibleTomorrowTasks = showAll ? tomorrowTasks : tomorrowTasks.slice(0, 5);
    const visibleLaterTasks = showAll ? laterTasks : laterTasks.slice(0, 5);

    const hiddenCount = (todayTasks.length - visibleTodayTasks.length) +
        (tomorrowTasks.length - visibleTomorrowTasks.length) +
        (laterTasks.length - visibleLaterTasks.length);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active && over && active.id !== over.id) {
            const oldIndex = tasks.findIndex((t) => t.id === active.id);
            const newIndex = tasks.findIndex((t) => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newTasks = [...tasks];
                const activeTask = { ...newTasks[oldIndex] };
                const overTask = newTasks[newIndex];

                // Bug 47: Move task date if dragged across categories
                if (normalizeDate(activeTask.scheduledDate) !== normalizeDate(overTask.scheduledDate)) {
                    activeTask.scheduledDate = overTask.scheduledDate;
                }

                newTasks[oldIndex] = activeTask;
                const reordered = arrayMove(newTasks, oldIndex, newIndex);
                reorderTasks(reordered);
            }
        }
    };

    // Task Limit Warning (Feature 13)
    const [taskLimitWarning, setTaskLimitWarning] = useState({ isOpen: false, description: null });

    const handleAddTask = async (description) => {
        setIsEvaluating(true);
        const openTasksCount = tasks.filter(t => !t.completed).length;

        if (openTasksCount >= 5) {
            setTaskLimitWarning({ isOpen: true, description });
            setIsEvaluating(false);
            return;
        }

        await processTaskAdd(description);
    };

    const processTaskAdd = async (description) => {
        setIsEvaluating(true);
        const activeTasks = tasks.map(t => t.description);

        try {
            const evaluation = await aiService.evaluateTask(description, {
                userName,
                streak,
                stats: getStats()
            });

            if (evaluation.rateLimited) {
                setAiModal({ type: 'warning', isOpen: true, data: { message: evaluation.message } });
                addTask(description);
                setIsEvaluating(false);
                return;
            }

            if (!evaluation.isSpecific || !evaluation.canCompleteInOneHour) {
                setAiModal({
                    type: 'clarification',
                    isOpen: true,
                    data: {
                        originalTask: description,
                        question: evaluation.clarificationQuestion || "Could you break this down further?",
                        suggestions: evaluation.suggestion || []
                    }
                });
            } else {
                // Check for intervention based on existing tasks
                const intervention = aiService.shouldIntervene(description, activeTasks);
                if (intervention) {
                    const tempTask = { id: 'temp-' + Date.now(), description };
                    setAiModal({
                        type: 'intervention',
                        isOpen: true,
                        data: {
                            task: tempTask,
                            intervention
                        }
                    });
                } else {
                    addTask(description);
                }
            }
        } catch (error) {
            console.error(error);
            addTask(description);
        } finally {
            setIsEvaluating(false);
        }
    };

    const confirmTaskLimit = () => {
        if (taskLimitWarning.description) {
            processTaskAdd(taskLimitWarning.description);
        }
        setTaskLimitWarning({ isOpen: false, description: null });
    };

    const handleChatOpen = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            setChatModal({
                isOpen: true,
                task: task,
                history: [],
                loading: false
            });
        }
    };

    const handleChatSend = async (message, isAutoAdd = false) => {
        const newHistory = [...chatModal.history, { role: 'user', content: message }];
        setChatModal(prev => ({ ...prev, history: newHistory, loading: !isAutoAdd }));

        // Track AI chat usage
        analytics.trackAiChatUsed();

        // Bug 27: If the user explicitly asked to add all tasks, we bypass the AI call 
        // to avoid round-trip latency and just append a confirmation from the AI.
        if (isAutoAdd) {
            setChatModal(prev => ({
                ...prev,
                history: [...newHistory, { role: 'ai', content: "Okay, I've added those tasks to your list!" }],
                loading: false
            }));
            return;
        }

        const response = await aiService.chatHelp(
            chatModal.task.description,
            newHistory,
            { userName, streak, stats: getStats() }
        );

        if (response.rateLimited) {
            setChatModal(prev => ({
                ...prev,
                loading: false,
                history: [...newHistory, { role: 'ai', content: "You have reached the limit of 50 AI requests for the day. This will reset tomorrow." }]
            }));
            return;
        }

        if (!response.error) {
            setChatModal(prev => ({
                ...prev,
                history: [...newHistory, {
                    role: 'ai',
                    content: response.message,
                    suggestedTasks: response.suggestedTasks // Store suggestions
                }],
                loading: false
            }));

            // Remove the auto-action logic
        } else {
            setChatModal(prev => ({
                ...prev,
                loading: false,
                history: [...newHistory, { role: 'ai', content: "Sorry, I'm having trouble connecting. Please try again." }]
            }));
        }
    };

    const handleEdit = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            setEditModal({
                isOpen: true,
                taskId: id,
                currentDescription: task.description,
                initialDate: task.scheduledDate || new Date().toISOString(),
                initialNotes: task.notes || ""
            });
        }
    };

    const handleSaveEdit = (newDescription, newDate, newNotes) => {
        if (editModal.taskId) {
            updateTask(editModal.taskId, { description: newDescription, scheduledDate: newDate, notes: newNotes });
            analytics.trackItemUpdated(!!newNotes);
        }
        setEditModal({ isOpen: false, taskId: null, currentDescription: "", initialDate: null, initialNotes: "" });
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

        analytics.trackItemMovedToTomorrow(newCount);

        // AI Intervention for Stuck Tasks (Moved 3+ times)
        if (newCount >= 3) {
            const intervention = await aiService.getStuckIntervention(
                task.description,
                3, // Mock days stuck
                newCount,
                { userName, streak, stats: getStats() }
            );

            if (intervention.rateLimited) {
                // Do not throw an alert on simple moves as to not annoy the user with repeated alerts when they drag/drop or move tasks often
                return;
            }

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

    const handleFocusTask = (taskId, duration = null) => {
        setFocusingTaskId(taskId);
        setTimeout(() => {
            setFocusTaskId(taskId);
            setFocusTaskDuration(duration);
            setFocusingTaskId(null);
        }, 600); // Wait for the 500ms transition to finish before entering Focus Mode
    };

    const currentFocusTask = focusTaskId ? tasks.find(t => t.id === focusTaskId) : null;

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    if (currentFocusTask) {
        return (
            <FocusMode
                task={currentFocusTask}
                initialDuration={focusTaskDuration}
                onComplete={() => completeTask(currentFocusTask.id)}
                onExit={() => {
                    setFocusTaskId(null);
                    setFocusTaskDuration(null);
                }}
            />
        );
    }

    const TaskList = ({ tasks, title, emptyMsg, showDate, isSortable, onStartTimer }) => (
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
                        onComplete={handleCompleteWrapper}
                        onPin={pinTask}
                        onDelete={deleteTask}
                        onEdit={handleEdit}
                        onMove={handleMove}
                        onChat={handleChatOpen}
                        onToggleTimer={toggleTimer}
                        onStartTimer={onStartTimer}
                        onFocusTask={handleFocusTask}
                        showDate={showDate}
                        showDragHandle={isSortable && !task.pinned && !task.completed}
                        isFocusing={focusingTaskId === task.id}
                        isNotFocusing={focusingTaskId !== null && focusingTaskId !== task.id}
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50/50 p-8 font-sans text-slate-900 transition-colors duration-500 overflow-y-auto">
            <div className="max-w-2xl mx-auto pb-20">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3">
                        <img src="/icons/icon48.png" alt="Todo Logo" className="w-8 h-8 rounded shadow-sm" />
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Todo</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {tasks.some(t => !t.completed) && (
                            <button
                                onClick={() => {
                                    const firstActive = visibleTodayTasks.find(t => !t.completed) || sortedTasks.find(t => !t.completed);
                                    if (firstActive) {
                                        handleFocusTask(firstActive.id);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all font-medium text-sm"
                            >
                                <Radio className="w-4 h-4" />
                                Focus Mode
                            </button>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowGamePlan(true)}
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-xl transition-all font-semibold",
                                    "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 shadow-sm"
                                )}
                                title="Game Plan"
                            >
                                <Target className="w-5 h-5 text-blue-500" />
                            </button>
                            <button
                                onClick={() => setIsStatsOpen(true)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-semibold",
                                    streak?.isFrozen
                                        ? "bg-blue-50 text-blue-600 border-2 border-blue-200"
                                        : !hasRecentTasks
                                            ? "bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm"
                                            : "bg-orange-50 text-orange-600 border-2 border-orange-200"
                                )}
                            >
                                {streak?.isFrozen ? (
                                    <Snowflake className="w-4 h-4 text-blue-500" />
                                ) : !hasRecentTasks ? (
                                    <Flame className="w-4 h-4 text-blue-400" />
                                ) : (
                                    <Flame className="w-4 h-4 text-orange-500" />
                                )}
                                {streak?.count || 0}
                            </button>
                        </div>
                    </div>
                </div>

                {showRating && <RatingPrompt onDismiss={handleDismissRating} />}

                {/* Input */}
                <TaskInput onAddTask={handleAddTask} isEvaluating={isEvaluating} />

                {/* Sections */}
                <div className="mt-8">
                    {showSortPrompt && (
                        <div className="mb-6 p-4 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                <ListOrdered className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-900 mb-1">Prioritize your tasks</h4>
                                <p className="text-sm text-blue-700/80">Take a minute to drag and drop these tasks into priority order before you begin.</p>
                            </div>
                            <button
                                onClick={handleDismissSortPrompt}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200"
                            >
                                Got it
                            </button>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={[
                                ...visibleTodayTasks.filter(t => !t.pinned && !t.completed).map(t => t.id),
                                ...visibleTomorrowTasks.filter(t => !t.completed).map(t => t.id),
                                ...visibleLaterTasks.filter(t => !t.completed).map(t => t.id)
                            ]}
                            strategy={verticalListSortingStrategy}
                        >
                            <TaskList
                                tasks={visibleTodayTasks}
                                title="Today"
                                emptyMsg={tomorrowTasks.length === 0 && laterTasks.length === 0 ? "No tasks yet. You're free!" : "No tasks for today."}
                                isSortable={true}
                                onStartTimer={startTimer}
                            />

                            {/* Controls Footer */}
                            <div className="mt-4 mb-8 flex items-center justify-center gap-4">
                                {hiddenCount > 0 && !showAll && (
                                    <button
                                        onClick={() => setShowAll(true)}
                                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white px-5 py-2.5 rounded-xl border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 flex flex-1 max-w-[200px] justify-center"
                                    >
                                        Show {hiddenCount} more
                                    </button>
                                )}
                                {showAll && (todayTasks.length > 5 || tomorrowTasks.length > 5 || laterTasks.length > 5) && (
                                    <button
                                        onClick={() => setShowAll(false)}
                                        className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white px-5 py-2.5 rounded-xl border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 flex flex-1 max-w-[200px] justify-center"
                                    >
                                        Show less
                                    </button>
                                )}
                                <button
                                    onClick={toggleShowCompleted}
                                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all bg-white px-5 py-2.5 rounded-xl border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 flex flex-1 max-w-[200px] justify-center"
                                >
                                    {showCompleted ? "Hide completed" : "Show completed"}
                                </button>
                            </div>

                            {visibleTomorrowTasks.length > 0 && (
                                <TaskList tasks={visibleTomorrowTasks} title="Tomorrow" showDate isSortable={true} onStartTimer={startTimer} />
                            )}

                            {visibleLaterTasks.length > 0 && (
                                <TaskList tasks={visibleLaterTasks} title="Later" showDate isSortable={true} onStartTimer={startTimer} />
                            )}
                        </SortableContext>
                    </DndContext>
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
                    onAddTask={addTask}
                    onAction={(duration) => {
                        handleFocusTask(aiModal.data.task.id, duration);
                    }}
                />
            )}

            <EditTaskModal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ ...editModal, isOpen: false })}
                initialTask={editModal.currentDescription}
                initialDate={editModal.initialDate}
                initialNotes={editModal.initialNotes}
                onSave={handleSaveEdit}
            />

            <OnboardingModal
                isOpen={!loading && !userName}
                onSave={setUserName}
            />

            <AccomplishmentsModal
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
                stats={getStats()}
                streak={streak}
                userName={userName}
                tasks={tasks} // Pass tasks for local time distributions
                hasRecentTasks={hasRecentTasks}
            />

            <GamePlanModal
                isOpen={showGamePlan}
                onClose={() => setShowGamePlan(false)}
                userName={userName}
                todayTasks={todayTasks}
                onPinTask={pinTask}
            />

            <DailyRecapModal
                isOpen={dailyRecap.isOpen}
                onClose={() => setDailyRecap({ ...dailyRecap, isOpen: false })}
                recapText={dailyRecap.text}
            />

            <FridaySummaryModal
                isOpen={fridaySummary.isOpen}
                onClose={() => setFridaySummary({ ...fridaySummary, isOpen: false })}
                userName={userName}
                stats={fridaySummary.stats}
            />

            <MentorshipModal
                isOpen={showMentorship}
                onClose={handleDismissMentorship}
                userName={userName}
            />

            <ChatModal
                isOpen={chatModal.isOpen}
                onClose={() => setChatModal(prev => ({ ...prev, isOpen: false }))}
                task={chatModal.task}
                history={chatModal.history}
                loading={chatModal.loading}
                onSend={handleChatSend}
                onAddTask={addTask} // Pass addTask function
            />

            <TaskNotesModal
                isOpen={notesModal.isOpen}
                onClose={() => setNotesModal({ isOpen: false, task: null, type: null })}
                task={notesModal.task}
                type={notesModal.type}
                onSave={handleSaveNotes}
            />



            <TaskLimitWarningModal
                isOpen={taskLimitWarning.isOpen}
                onClose={() => setTaskLimitWarning({ isOpen: false, description: null })}
                onProceed={confirmTaskLimit}
            />

            {celebration && (
                <>
                    <Confetti intensity={celebration.intensity} onComplete={() => setCelebration(null)} />
                    <Toast message={celebration.message} onClose={() => setCelebration(null)} />
                </>
            )}
        </div>
    );
}
