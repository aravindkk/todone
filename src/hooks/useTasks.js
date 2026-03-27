import { useState, useEffect, useMemo } from "react";
import { storage } from "../lib/storage";
import { analytics } from "../services/analytics";

const TASKS_KEY = "todo_tasks";
const USER_NAME_KEY = "todo_user_name";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [userName, setUserName] = useState(null);
    const [installDate, setInstallDate] = useState(null);
    const [loading, setLoading] = useState(true);

    const calculateStreak = (currentTasks) => {
        const counts = {};
        const toLocalDate = d => new Date(d).toLocaleDateString('en-CA');
        currentTasks.forEach(t => {
            if (t.completed && t.completedAt) {
                const date = toLocalDate(t.completedAt);
                counts[date] = (counts[date] || 0) + 1;
            }
        });

        const normalize = d => d.toLocaleDateString('en-CA');
        // Returns the Sunday that starts the week containing d (Sun–Sat weeks)
        const getWeekKey = (d) => {
            const copy = new Date(d);
            copy.setDate(copy.getDate() - copy.getDay());
            return copy.toLocaleDateString('en-CA');
        };

        let streak = 0;
        const weekSkips = {}; // weekKey → skipped days used

        const current = new Date();
        current.setHours(0, 0, 0, 0);

        // Free pass for today — the day might still be in progress
        if (!counts[normalize(current)]) {
            current.setDate(current.getDate() - 1);
        }

        // Walk backwards: each week allows up to 2 skip days without breaking the streak
        for (let i = 0; i < 365; i++) {
            const dateStr = normalize(current);
            if (counts[dateStr]) {
                streak++;
            } else {
                const weekKey = getWeekKey(current);
                weekSkips[weekKey] = (weekSkips[weekKey] || 0) + 1;
                if (weekSkips[weekKey] > 2) break;
                // Skip consumed — continue walking without incrementing streak
            }
            current.setDate(current.getDate() - 1);
        }

        return streak;
    };

    const streak = useMemo(() => calculateStreak(tasks), [tasks]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const loadedTasks = await storage.get(TASKS_KEY, []);
        const loadedName = await storage.get(USER_NAME_KEY, null);

        let iDate = await storage.get('todo_install_date', null);
        if (!iDate) {
            iDate = new Date().toISOString();
            await storage.set('todo_install_date', iDate);
            analytics.trackNewInstall();
        }

        const lastActiveDate = await storage.get('todo_last_active_date', null);
        const todayStr = new Date().toLocaleDateString();
        if (lastActiveDate !== todayStr) {
            analytics.trackActiveDay();
            await storage.set('todo_last_active_date', todayStr);
        }

        // Auto-rollover: bump any uncompleted past tasks to today's midnight
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const rolledOver = loadedTasks.map(t => {
            if (t.completed) return t;
            const scheduled = new Date(t.scheduledDate || todayMidnight);
            scheduled.setHours(0, 0, 0, 0);
            if (scheduled < todayMidnight) {
                return { ...t, scheduledDate: todayMidnight.toISOString() };
            }
            return t;
        });
        const didRollover = rolledOver.some((t, i) => t.scheduledDate !== loadedTasks[i].scheduledDate);
        if (didRollover) await storage.set(TASKS_KEY, rolledOver);

        setTasks(rolledOver);
        setUserName(loadedName);
        setInstallDate(iDate);
        setLoading(false);
    };

    const saveTasks = async (newTasks) => {
        setTasks(newTasks);
        await storage.set(TASKS_KEY, newTasks);
    };

    const saveUserName = async (name) => {
        setUserName(name);
        await storage.set(USER_NAME_KEY, name);
    };

    const addTask = (description) => {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const newTask = {
            id: Date.now(),
            description,
            pinned: false,
            completed: false,
            moveCount: 0,
            order: 0, // Default order
            createdAt: new Date().toISOString(),
            scheduledDate: todayMidnight.toISOString(), // Local midnight
            emotion: null,
            confidence: null,
            elapsedTime: 0,
            isRunning: false,
            lastStartTime: null
        };
        saveTasks([newTask, ...tasks]);
        analytics.trackTaskAdded(false);
    };

    const addMultipleTasks = (descriptions) => {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const newTasks = descriptions.map((desc, index) => ({
            id: Date.now() + index, // Ensure unique IDs
            description: desc,
            pinned: false,
            completed: false,
            moveCount: 0,
            order: 0,
            createdAt: new Date().toISOString(),
            scheduledDate: todayMidnight.toISOString(), // Local midnight
            emotion: null,
            confidence: null,
            elapsedTime: 0,
            isRunning: false,
            lastStartTime: null
        }));
        saveTasks([...newTasks, ...tasks]);
        analytics.trackTasksAddedBatch(descriptions.length);
    };

    const reorderTasks = (newTasks) => {
        saveTasks(newTasks);
    };

    const completeTask = (id) => {
        const newTasks = tasks.map(t => {
            if (t.id === id) {
                if (!t.completed) analytics.trackTaskCompleted();
                return { ...t, completed: !t.completed, completedAt: new Date().toISOString() };
            }
            return t;
        });
        saveTasks(newTasks);
    };

    const pinTask = (id) => {
        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, pinned: !t.pinned } : t
        );
        saveTasks(newTasks);
    };

    const deleteTask = (id) => {
        const newTasks = tasks.filter(t => t.id !== id);
        saveTasks(newTasks);
        analytics.trackItemDeleted();
    };

    const updateTask = (id, updates) => {
        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        saveTasks(newTasks);
    };

    const toggleTimer = (id) => {
        const newTasks = tasks.map(t => {
            if (t.id === id) {
                const now = Date.now();
                if (t.isRunning) {
                    // Stop
                    const elapsedSinceStart = now - new Date(t.lastStartTime).getTime();
                    return {
                        ...t,
                        isRunning: false,
                        elapsedTime: (t.elapsedTime || 0) + elapsedSinceStart,
                        lastStartTime: null
                    };
                } else {
                    // Start
                    // Stop others? Maybe multiple tasks can run? Let's allow multiple for now or stop others.
                    // Usually only one task active at a time is best for tracking.
                    return {
                        ...t,
                        isRunning: true,
                        lastStartTime: new Date().toISOString()
                    };
                }
            }
            // Optional: Stop other tasks if one starts?
            // if (t.isRunning) return { ...t, isRunning: false, ...updateElapsedTime... }
            return t;
        });
        saveTasks(newTasks);
    };

    const startTimer = (id, durationMinutes) => {
        const newTasks = tasks.map(t => {
            if (t.id === id) {
                return {
                    ...t,
                    isRunning: true,
                    lastStartTime: new Date().toISOString(),
                    timerDuration: durationMinutes
                };
            }
            return t;
        });
        saveTasks(newTasks);
    };

    const getStats = () => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const completedTasks = tasks.filter(t => t.completed && t.completedAt);
        const completedInLast30Days = completedTasks.filter(t => new Date(t.completedAt) >= thirtyDaysAgo);

        // Heatmap Data (Last 365 days)
        const heatmap = {};
        completedTasks.forEach(t => {
            const date = t.completedAt.split('T')[0];
            heatmap[date] = (heatmap[date] || 0) + 1;
        });

        // Quick Tasks (< 4h) & Long Tasks (> 6h)
        // Use time from creation to completion as the duration metric
        const quickTasks = completedTasks.filter(t => {
            if (!t.createdAt || !t.completedAt) return false;
            const durationMinutes = (new Date(t.completedAt) - new Date(t.createdAt)) / 1000 / 60;
            return durationMinutes > 0 && durationMinutes < 240; // < 4 hours
        }).slice(0, 5);

        const longTasks = completedTasks.filter(t => {
            if (!t.createdAt || !t.completedAt) return false;
            const durationMinutes = (new Date(t.completedAt) - new Date(t.createdAt)) / 1000 / 60;
            return durationMinutes > 360; // > 6 hours
        }).slice(0, 5);

        // Hourly Activity (Last 7 days based on LOCAL TIME)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, created: 0, completed: 0 }));

        tasks.forEach(t => {
            if (t.createdAt) {
                const createdDate = new Date(t.createdAt);
                if (createdDate >= sevenDaysAgo) {
                    hourlyData[createdDate.getHours()].created++;
                }
            }
            if (t.completed && t.completedAt) {
                const compDate = new Date(t.completedAt);
                if (compDate >= sevenDaysAgo) {
                    hourlyData[compDate.getHours()].completed++;
                }
            }
        });

        // Bug 61: Task Movement Stats
        const tasksWithMoves = tasks.filter(t => t.moveCount > 0);
        const percentMoved = tasks.length > 0 ? Math.round((tasksWithMoves.length / tasks.length) * 100) : 0;

        const topMovedTasks = [...tasksWithMoves]
            .sort((a, b) => b.moveCount - a.moveCount)
            .slice(0, 3);

        return {
            totalCompleted: completedTasks.length,
            completed30Days: completedInLast30Days.length,
            heatmap,
            quickTasks,
            longTasks,
            hourlyData,
            percentMoved,
            topMovedTasks
        };
    };

    // Bug 51: Calculate if user has any tasks created in the last 7 days
    const hasRecentTasks = tasks.some(t => {
        if (!t.createdAt) return false;
        const createdDate = new Date(t.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return createdDate >= sevenDaysAgo;
    });

    return {
        tasks,
        loading,
        addTask,
        addMultipleTasks,
        reorderTasks,
        completeTask,
        pinTask,
        deleteTask,
        updateTask,
        toggleTimer,
        startTimer,
        streak,
        userName,
        setUserName: saveUserName,
        installDate,
        getStats,
        hasRecentTasks // Bug 51
    };
}
