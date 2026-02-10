import { useState, useEffect } from "react";
import { storage } from "../lib/storage";

const TASKS_KEY = "todone_tasks";
const USER_NAME_KEY = "todone_user_name";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(true);

    const calculateStreak = (currentTasks) => {
        const counts = {};
        currentTasks.forEach(t => {
            if (t.completed && t.completedAt) {
                const date = t.completedAt.split('T')[0];
                counts[date] = (counts[date] || 0) + 1;
            }
        });

        let streak = 0;
        const today = new Date();
        const normalize = d => d.toISOString().split('T')[0];

        // Start checking from today
        let current = new Date(today);
        let dateStr = normalize(current);

        // If today doesn't have enough tasks yet, check if yesterday kept the streak alive
        if ((counts[dateStr] || 0) < 3) {
            current.setDate(current.getDate() - 1);
            dateStr = normalize(current);
            if ((counts[dateStr] || 0) < 3) {
                return 0;
            }
        }

        while (true) {
            if ((counts[dateStr] || 0) >= 3) {
                streak++;
                current.setDate(current.getDate() - 1);
                dateStr = normalize(current);
            } else {
                break;
            }
        }
        return streak;
    };

    const streak = calculateStreak(tasks);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const loadedTasks = await storage.get(TASKS_KEY, []);
        const loadedName = await storage.get(USER_NAME_KEY, null);
        setTasks(loadedTasks);
        setUserName(loadedName);
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
        const newTask = {
            id: Date.now(),
            description,
            pinned: false,
            completed: false,
            moveCount: 0,
            order: 0, // Default order
            createdAt: new Date().toISOString(),
            scheduledDate: new Date().toISOString(), // Default to Today
            emotion: null,
            confidence: null,
            elapsedTime: 0,
            isRunning: false,
            lastStartTime: null
        };
        saveTasks([newTask, ...tasks]);
    };

    const addMultipleTasks = (descriptions) => {
        const newTasks = descriptions.map((desc, index) => ({
            id: Date.now() + index, // Ensure unique IDs
            description: desc,
            pinned: false,
            completed: false,
            moveCount: 0,
            order: 0,
            createdAt: new Date().toISOString(),
            scheduledDate: new Date().toISOString(), // Default to Today
            emotion: null,
            confidence: null,
            elapsedTime: 0,
            isRunning: false,
            lastStartTime: null
        }));
        saveTasks([...newTasks, ...tasks]);
    };

    const reorderTasks = (newTasks) => {
        saveTasks(newTasks);
    };

    const completeTask = (id) => {
        const newTasks = tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed, completedAt: new Date().toISOString() } : t
        );
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

        // Quick Tasks (< 15 mins) & Long Tasks (> 4 hours)
        // using timerDuration if available, else elapsed. If neither, we can't guess.
        const quickTasks = completedTasks.filter(t => {
            const duration = t.timerDuration ? t.timerDuration * 60 : (t.elapsedTime / 1000 / 60);
            return duration > 0 && duration < 15; // < 15 mins
        }).slice(0, 5);

        const longTasks = completedTasks.filter(t => {
            const duration = t.timerDuration ? t.timerDuration * 60 : (t.elapsedTime / 1000 / 60);
            return duration > 360; // > 6 hours
        }).slice(0, 5);

        return {
            totalCompleted: completedTasks.length,
            completed30Days: completedInLast30Days.length,
            heatmap,
            quickTasks,
            longTasks
        };
    };

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
        getStats
    };
}
