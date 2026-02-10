import { useState, useEffect } from "react";
import { storage } from "../lib/storage";

const TASKS_KEY = "todone_tasks";

export function useTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const loaded = await storage.get(TASKS_KEY, []);
        // Ensure dates are dates if needed, or just strings
        setTasks(loaded);
        setLoading(false);
    };

    const saveTasks = async (newTasks) => {
        setTasks(newTasks);
        await storage.set(TASKS_KEY, newTasks);
        loadTasks()
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
            confidence: null
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
            confidence: null
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

    return {
        tasks,
        loading,
        addTask,
        addMultipleTasks,
        reorderTasks,
        completeTask,
        pinTask,
        deleteTask,
        updateTask
    };
}
