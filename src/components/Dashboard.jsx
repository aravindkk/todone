import { useState, useEffect, useRef } from "react";
import { TaskInput } from "./TaskInput";
import { TaskCard } from "./TaskCard";
import { StreakCounter } from "./StreakCounter";
import { useTasks } from "../hooks/useTasks";
import { FocusMode } from "./FocusMode";
import { BreakdownModal } from "./ai/BreakdownModal";
import { InterventionModal } from "./ai/InterventionModal";
import { ClarificationModal } from "./ai/ClarificationModal";
import { ElaborateModal } from "./ai/ElaborateModal";
import { EditTaskModal } from "./EditTaskModal";
import { NewUserOnboarding } from "./NewUserOnboarding";
import { AccomplishmentsModal } from "./AccomplishmentsModal";
import { DailyRecapModal } from "./DailyRecapModal";
import { FridaySummaryModal } from "./FridaySummaryModal";
import { ChatModal } from "./ai/ChatModal";
import { RatingPrompt } from "./RatingPrompt";
import { TaskNotesModal } from "./TaskNotesModal";
import { MentorshipModal } from "./MentorshipModal";
import { TaskLimitWarningModal } from "./TaskLimitWarningModal";
import { Confetti, Toast } from "./ui/Confetti";
import { Dialog } from "./ui/Dialog";
import { aiService } from "../services/ai";
import { analytics } from "../services/analytics";
import { storage } from "../lib/storage";
import { cn } from "../lib/utils";
import { Activity, Clock, LogOut, CheckCircle2, ChevronDown, Calendar, LineChart, Target, Radio, ArrowRight, ListOrdered, Flame, Snowflake } from "lucide-react";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

function playTaskCompleteSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const master = ctx.createGain();
        const compressor = ctx.createDynamicsCompressor();
        compressor.connect(ctx.destination);
        master.connect(compressor);
        master.gain.setValueAtTime(0.7, ctx.currentTime);

        // Three-note ascending chime: E5 → G#5 → B5 (like Teams/Meet)
        const notes = [
            { freq: 659.25, start: 0, duration: 0.18 },
            { freq: 830.61, start: 0.14, duration: 0.18 },
            { freq: 987.77, start: 0.28, duration: 0.45 },
        ];

        notes.forEach(({ freq, start, duration }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(0, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
            osc.connect(gain);
            gain.connect(master);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        });

        setTimeout(() => ctx.close(), 1200);
    } catch (_) {}
}

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

    // Streak milestone toasts
    const prevStreakRef = useRef(null);
    useEffect(() => {
        if (!streak || loading) return;
        const prev = prevStreakRef.current;
        prevStreakRef.current = streak;
        if (prev === null) return; // Don't fire on initial load
        const milestones = [3, 7, 14, 30];
        const hit = milestones.find(m => streak >= m && (prev === null || prev < m));
        if (hit) {
            const msgs = {
                3: "3 days in a row. The habit is starting. 🌱",
                7: "A full week. You're building something real. 🔥",
                14: "Two weeks straight. This is who you are now. 💪",
                30: "30 days. That's not a streak — that's a lifestyle. 🏆",
            };
            setCelebration({ message: msgs[hit], intensity: 'heavy' });
        }
    }, [streak, loading]);

    // Rating Prompt Logic
    const [showRating, setShowRating] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState(null);

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

            // Only show during morning hours (5 AM – 12 PM)
            const hour = today.getHours();
            if (hour < 5 || hour >= 12) return;

            // Only show after at least 1 full day since install
            const daysSinceInstall = installDate ? (today - new Date(installDate)) / (1000 * 60 * 60 * 24) : 0;
            if (daysSinceInstall < 1) return;

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

            // Only show after at least 7 days since install (user has experienced a full week)
            const daysSinceInstall = installDate ? (today - new Date(installDate)) / (1000 * 60 * 60 * 24) : 0;
            if (daysSinceInstall < 7) return;

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
    }, [loading, tasks, installDate]);

    const handleCompleteWrapper = (id) => {
        const task = tasks.find(t => t.id === id);
        completeTask(id);

        if (task && !task.completed && task.createdAt) {
            playTaskCompleteSound();

            const ageMs = new Date() - new Date(task.createdAt);
            const ageDays = ageMs / (1000 * 60 * 60 * 24);
            const ageMinutes = ageMs / (1000 * 60);
            const humanDuration = formatDurationHuman(ageMs);

            const completedTodayCount = tasks.filter(t =>
                t.completed && t.completedAt &&
                new Date(t.completedAt).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
            ).length;
            const openTodayCount = tasks.filter(t =>
                !t.completed && normalizeDate(t.scheduledDate) <= today
            ).length;

            // Context-aware celebration message
            let message;
            if (openTodayCount === 0) {
                message = "That's everything for today. Nicely done. 🎉";
            } else if ((task.moveCount || 0) >= 2) {
                message = `Finally got there — that one was stubborn. Done in ${humanDuration}.`;
            } else if (completedTodayCount >= 2) {
                message = "On a roll — keep that energy. 🔥";
            } else if (ageMinutes < 30) {
                message = `Quick win in ${humanDuration}. 💪 Those add up.`;
            } else if (ageDays > 3) {
                message = `Took ${humanDuration}, but you got there. That's what matters.`;
            } else if (completedTodayCount === 0) {
                message = "First one down. That's the hardest part.";
            } else {
                message = `Done in ${humanDuration}. Nice work.`;
            }

            const intensity = ageDays > 3 ? 'heavy' : 'normal';
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
    const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = normalizeDate(tomorrowDate);

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

                // Bug 47: Move task date if dragged across categories — always store as local midnight
                if (normalizeDate(activeTask.scheduledDate) !== normalizeDate(overTask.scheduledDate)) {
                    const d = overTask.scheduledDate ? new Date(overTask.scheduledDate) : new Date();
                    d.setHours(0, 0, 0, 0);
                    activeTask.scheduledDate = d.toISOString();
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
            const todayStr = new Date().toLocaleDateString('en-CA');
            const lastWarningDate = await storage.get('todo_task_limit_warning_date', null);
            if (lastWarningDate !== todayStr) {
                await storage.set('todo_task_limit_warning_date', todayStr);
                setTaskLimitWarning({ isOpen: true, description });
                setIsEvaluating(false);
                return;
            }
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

            // Normalize type — Gemini may return variations in casing/spacing
            const evalType = (evaluation.type || '').toUpperCase().replace(/\s+/g, '_').trim();
            const isVague = evalType.includes('VAGUE');
            const isBig = evalType.includes('BIG') || (!evaluation.isSpecific && evaluation.suggestion?.length > 0) || (evaluation.canCompleteInOneHour === false && evaluation.isSpecific);
            const isAmbiguous = isVague || (evaluation.isSpecific === false && !evaluation.suggestion?.length);

            if (evaluation.error) {
                addTask(description);
            } else if (isAmbiguous) {
                setAiModal({
                    type: 'elaborate',
                    isOpen: true,
                    data: {
                        originalTask: description,
                        elaboratePrompt: evaluation.elaboratePrompt || evaluation.clarificationQuestion || "What exactly needs to happen for this to be done?",
                    }
                });
            } else if (isBig) {
                setAiModal({
                    type: 'clarification',
                    isOpen: true,
                    data: {
                        originalTask: description,
                        question: "This looks like a big one. Want to break it into focused micro-tasks?",
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
                history: [{ role: 'ai', content: "Let's think through this together." }],
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

        // Always move to at least tomorrow relative to today.
        // If the task is already scheduled in the future, advance from its date instead.
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);

        const currentScheduled = task.scheduledDate ? new Date(task.scheduledDate) : new Date();
        currentScheduled.setHours(0, 0, 0, 0);

        const base = currentScheduled > todayMidnight ? currentScheduled : todayMidnight;
        const nextDay = new Date(base);
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

    const handleElaborateSubmit = (elaboratedDescription) => {
        addTask(elaboratedDescription);
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
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        if (hour < 12) {
            if (day === 1) return "Happy Monday";
            if (day === 5) return "Happy Friday";
            return "Good morning";
        }
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const handleOnboardingComplete = async (name, taskDescriptions) => {
        await setUserName(name);
        if (taskDescriptions.length > 0) {
            addMultipleTasks(taskDescriptions);
        }
    };

    if (!loading && !userName) {
        return <NewUserOnboarding onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50/50 p-8 font-sans text-slate-900 transition-colors duration-500 overflow-y-auto">
            <div className="max-w-2xl mx-auto pb-20">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3">
                        <img src="/icons/icon48.png" alt="ClariTask Logo" className="w-8 h-8 rounded shadow-sm" />
                        <h1 className="text-3xl font-light tracking-tight text-slate-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>ClariTask</h1>
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
                                onClick={() => setIsStatsOpen(true)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-semibold",
                                    !hasRecentTasks
                                        ? "bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm"
                                        : "bg-orange-50 text-orange-600 border-2 border-orange-200"
                                )}
                            >
                                {!hasRecentTasks ? (
                                    <Flame className="w-4 h-4 text-blue-400" />
                                ) : (
                                    <Flame className="w-4 h-4 text-orange-500" />
                                )}
                                {streak || 0}
                            </button>
                        </div>
                    </div>
                </div>

                {showRating && <RatingPrompt onDismiss={handleDismissRating} />}

                {/* Debug panel — toggle with: localStorage.setItem('claritask_debug','1') / removeItem */}
                {localStorage.getItem('claritask_debug') === '1' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs">
                        <p className="font-semibold text-yellow-800 mb-2">🛠 Debug popups</p>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setDailyRecap({ isOpen: true, text: "Great work yesterday! You knocked out 3 tasks and made solid progress. Let's keep that momentum going today!" })} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">Morning recap</button>
                            <button onClick={() => setFridaySummary({ isOpen: true, stats: { completedThisWeek: 8, longestCompletedTask: tasks.find(t => t.completed) || null } })} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">Friday wrap-up</button>
                            <button onClick={() => setTaskLimitWarning({ isOpen: true, description: "test task" })} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">Task limit warning</button>
                            <button onClick={() => setIsStatsOpen(true)} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">Stats / streak</button>
                            <button onClick={() => setShowRating(true)} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">Rating prompt</button>
                            <button onClick={() => setAiModal({ isOpen: true, type: 'elaborate', data: { originalTask: "do the thing", elaboratePrompt: "What exactly does 'do the thing' mean to you?" } })} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">Elaborate modal</button>
                            <button onClick={() => setAiModal({ isOpen: true, type: 'warning', data: { message: "You have reached the limit of 50 AI requests for the day. This will reset tomorrow." } })} className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded">AI warning</button>
                        </div>
                        <p className="font-semibold text-yellow-800 mt-3 mb-2">🎉 Personality toasts</p>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setCelebration({ message: "First one down. That's the hardest part.", intensity: 'normal' })} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-900 rounded">Toast: first task</button>
                            <button onClick={() => setCelebration({ message: "Quick win in 12 min. 💪 Those add up.", intensity: 'normal' })} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-900 rounded">Toast: quick win</button>
                            <button onClick={() => setCelebration({ message: "On a roll — keep that energy. 🔥", intensity: 'normal' })} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-900 rounded">Toast: on a roll</button>
                            <button onClick={() => setCelebration({ message: "Finally got there — that one was stubborn. Done in 3 days.", intensity: 'heavy' })} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-900 rounded">Toast: stubborn task</button>
                            <button onClick={() => setCelebration({ message: "That's everything for today. Nicely done. 🎉", intensity: 'heavy' })} className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-900 rounded">Toast: all done</button>
                            <button onClick={() => setCelebration({ message: "3 days in a row. The habit is starting. 🌱", intensity: 'heavy' })} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded">Streak: 3 days</button>
                            <button onClick={() => setCelebration({ message: "A full week. You're building something real. 🔥", intensity: 'heavy' })} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded">Streak: 7 days</button>
                            <button onClick={() => setCelebration({ message: "Two weeks straight. This is who you are now. 💪", intensity: 'heavy' })} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded">Streak: 14 days</button>
                            <button onClick={() => setCelebration({ message: "30 days. That's not a streak — that's a lifestyle. 🏆", intensity: 'heavy' })} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded">Streak: 30 days</button>
                        </div>
                        <p className="font-semibold text-yellow-800 mt-3 mb-2">💬 Chat welcome line</p>
                        <div className="flex flex-wrap gap-2">
                            {tasks.filter(t => !t.completed).slice(0, 3).map(t => (
                                <button key={t.id} onClick={() => handleChatOpen(t.id)} className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded truncate max-w-[200px]">Chat: {t.description.slice(0, 30)}</button>
                            ))}
                            {tasks.filter(t => !t.completed).length === 0 && <span className="text-yellow-700 italic">Add a task first to test chat</span>}
                        </div>
                    </div>
                )}

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
                            {isEvaluating && (
                                <div className="mb-2 px-4 py-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin flex-shrink-0" />
                                    <span className="text-sm text-slate-400">Evaluating task...</span>
                                </div>
                            )}
                            <TaskList
                                tasks={visibleTodayTasks}
                                title="Today"
                                emptyMsg={(() => {
                                    const hasNoTasksAnywhere = tomorrowTasks.length === 0 && laterTasks.length === 0;
                                    const allDoneToday = tasks.some(t => t.completed && new Date(t.completedAt || 0).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA'));
                                    const hour = new Date().getHours();
                                    if (hasNoTasksAnywhere && !allDoneToday) {
                                        return hour < 12 ? "Fresh start. What's the one thing that matters today?" : "Nothing on the list. Add something and let's go.";
                                    }
                                    if (hasNoTasksAnywhere && allDoneToday) {
                                        return "You cleared your list. Take a breath — you earned it. 🎉";
                                    }
                                    return "No tasks for today.";
                                })()}
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
            {aiModal.type === 'warning' && (
                <Dialog isOpen={aiModal.isOpen} onClose={() => setAiModal({ ...aiModal, isOpen: false })} className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-sm" hideHeader>
                    <p className="text-sm text-slate-600 mb-4">{aiModal.data?.message}</p>
                    <button onClick={() => setAiModal({ ...aiModal, isOpen: false })} className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">Got it</button>
                </Dialog>
            )}

            {aiModal.type === 'elaborate' && (
                <ElaborateModal
                    isOpen={aiModal.isOpen}
                    onClose={() => setAiModal({ ...aiModal, isOpen: false })}
                    originalTask={aiModal.data.originalTask}
                    elaboratePrompt={aiModal.data.elaboratePrompt}
                    onSubmit={handleElaborateSubmit}
                />
            )}

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

            <AccomplishmentsModal
                isOpen={isStatsOpen}
                onClose={() => setIsStatsOpen(false)}
                stats={getStats()}
                streak={streak}
                userName={userName}
                tasks={tasks} // Pass tasks for local time distributions
                hasRecentTasks={hasRecentTasks}
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
