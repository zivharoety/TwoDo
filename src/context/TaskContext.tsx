import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '../types';
import { differenceInDays, isBefore, addHours } from 'date-fns';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { notificationManager } from '../utils/notifications';

interface TaskContextType {
    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'created_at' | 'status'>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    toggleTaskCompletion: (id: string) => Promise<void>;
    toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
    nudgePartner: (taskId: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    availableTags: string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
    const tasksRef = React.useRef<Task[]>([]);

    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    const availableTags = React.useMemo(() =>
        Array.from(new Set(tasks.flatMap(t => t.tags || []))).sort(),
        [tasks]
    );

    // 1. Initial Fetch and Subscription
    useEffect(() => {
        if (!user) {
            setTasks([]);
            return;
        }

        const fetchTasks = async () => {
            console.log('Fetching tasks for user:', user.id);
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                console.log('Fetched tasks successfully:', data.length, 'tasks found');
                setTasks(data);
            }
            if (error) {
                console.error('Fetch tasks error:', error);
            }
        };

        fetchTasks();

        // Real-time subscription
        const channel = supabase
            .channel('tasks_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newTask = payload.new as Task;
                    setTasks(prev => {
                        if (prev.find(t => t.id === newTask.id)) return prev;
                        return [newTask, ...prev];
                    });
                    // Notification Scenario 1a: Partner assigned to me
                    if (newTask.assignee_id === user.id && newTask.creator_id !== user.id) {
                        notificationManager.show('🎁 NEW TASK ASSIGNED', {
                            body: `Partner assigned a new task to you: "${newTask.title}"`,
                            tag: `new-task-${newTask.id}`
                        });
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedTask = payload.new as Task;
                    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
                } else if (payload.eventType === 'DELETE') {
                    setTasks(prev => prev.filter(t => t.id !== payload.old.id));
                }
            })
            .subscribe();

        // Listen for "nudges" (Scenario 2)
        // We can use an ephemeral broadcast channel for nudges
        const nudgeChannel = supabase.channel(`nudge_${user.id}`)
            .on('broadcast', { event: 'nudge' }, (payload) => {
                notificationManager.show('🔔 NUDGE', {
                    body: `Your partner is asking about "${payload.payload.title}"!`,
                    tag: `nudge-${payload.payload.title}`
                });
            })
            .subscribe();

        // Listen for weekly milestones
        const milestoneChannel = supabase.channel(`milestone_${user.id}`)
            .on('broadcast', { event: 'milestone_reached' }, (payload) => {
                window.dispatchEvent(new CustomEvent('celebrate_milestone', { detail: payload.payload }));
            })
            .subscribe();

        // Listen for "task due" alerts
        const taskDueChannel = supabase.channel(`task_due_${user.id}`)
            .on('broadcast', { event: 'task_due' }, (payload) => {
                notificationManager.show(`⏰ ${payload.payload.isPartner ? 'PARTNER ' : ''}TASK DUE`, {
                    body: payload.payload.title,
                    tag: `due-${payload.payload.taskId}`
                });
            })
            .subscribe();

        // Request notification permission
        notificationManager.requestPermission();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(nudgeChannel);
            supabase.removeChannel(milestoneChannel);
            supabase.removeChannel(taskDueChannel);
        };
    }, [user]);

    // 2. Deadline Watchdog & Auto-Status
    useEffect(() => {
        if (!user) return;

        const checkTaskStatus = () => {
            const now = new Date();
            const currentTasks = tasksRef.current;

            currentTasks.forEach(async (task) => {
                if (task.status === 'completed' || !task.due_at) return;

                const dueDate = new Date(task.due_at);
                const isPastDue = isBefore(dueDate, now);
                const isDueSoon = isBefore(dueDate, addHours(now, 2)) && !isPastDue;

                let updates: Partial<Task> = {};

                // 1. Handle "Task Due" Notification
                if (isPastDue && task.status === 'active') {
                    updates.status = 'past_due';
                    const notifyKey = `due-${task.id}`;

                    if (!notifiedTaskIds.has(notifyKey)) {
                        setNotifiedTaskIds(prev => new Set(prev).add(notifyKey));

                        const isOwner = task.assignee_id === user.id || (!task.assignee_id && task.creator_id === user.id);
                        const isShared = task.visibility === 'shared';

                        // Notify current user if they are owner or partner of a shared task
                        if (isOwner || isShared) {
                            notificationManager.show(isOwner ? "⏰ Your task is due!" : `⏰ Partner's task is due!`, {
                                body: task.title,
                                tag: notifyKey
                            });
                        }

                        // If shared, broadcast to partner
                        if (isShared && user.partner_id) {
                            supabase.channel(`task_due_${user.partner_id}`).send({
                                type: 'broadcast',
                                event: 'task_due',
                                payload: {
                                    taskId: task.id,
                                    title: task.title,
                                    isPartner: true // To the partner, it's a partner task
                                }
                            });
                        }
                    }
                }

                // 2. Handle "Due Soon" (Watchdog logic already mostly there, but let's refine it)
                if (isDueSoon && task.status === 'active') {
                    const notifyKey = `${task.id}-due-soon`;
                    if (!notifiedTaskIds.has(notifyKey)) {
                        setNotifiedTaskIds(prev => new Set(prev).add(notifyKey));

                        const isOwner = task.assignee_id === user.id || (!task.assignee_id && task.creator_id === user.id);
                        if (isOwner) {
                            notificationManager.show("⏳ Task due in less than 2h", {
                                body: task.title,
                                tag: notifyKey
                            });
                        }
                    }
                }

                // 3. Priority Escalation (Logic based on daysUntil)
                const daysUntil = differenceInDays(dueDate, now);
                if (daysUntil <= 2 && task.priority !== 'high') updates.priority = 'high';
                else if (daysUntil <= 7 && daysUntil > 2 && task.priority === 'low') updates.priority = 'medium';

                if (Object.keys(updates).length > 0) {
                    await supabase.from('tasks').update(updates).eq('id', task.id);
                }
            });
        };

        const interval = setInterval(checkTaskStatus, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const addTask = async (newTask: Omit<Task, 'id' | 'created_at' | 'status'>) => {
        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                ...newTask,
                status: 'active'
            }])
            .select()
            .single();

        if (error) {
            console.error('Add task error:', error);
            throw error;
        }

        if (data) {
            setTasks(prev => [data as Task, ...prev]);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Update task error:', error);
            throw error;
        }

        if (data) {
            setTasks(prev => prev.map(t => t.id === id ? data as Task : t));
        }
    };

    const toggleTaskCompletion = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const isCurrentlyCompleted = task.status === 'completed';
        const newStatus = isCurrentlyCompleted ? 'active' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

        // 1. Optimistic Update
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, completed_at: completedAt || undefined } : t));

        try {
            // 2. Database Update
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: newStatus,
                    completed_at: completedAt
                })
                .eq('id', id);

            if (error) {
                console.error('DATABASE ERROR:', error.message);

                // Fallback: If completed_at column is missing, try updating only status
                if (error.message.includes('completed_at') || error.code === '42703') {
                    console.log('Attempting fallback update without completed_at...');
                    const { error: fallbackError } = await supabase
                        .from('tasks')
                        .update({ status: newStatus })
                        .eq('id', id);

                    if (fallbackError) throw fallbackError;
                } else {
                    throw error;
                }
            }

            // 3. Milestone logic
            if (newStatus === 'completed' && user) {
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                startOfWeek.setHours(0, 0, 0, 0);

                const weeklyCompletedCount = previousTasks.filter(t =>
                    t.status === 'completed' &&
                    t.completed_at &&
                    new Date(t.completed_at) >= startOfWeek
                ).length + 1;

                if (weeklyCompletedCount % 5 === 0 && weeklyCompletedCount > 0) {
                    if (user.partner_id) {
                        supabase.channel(`milestone_${user.partner_id}`).send({
                            type: 'broadcast',
                            event: 'milestone_reached',
                            payload: { count: weeklyCompletedCount }
                        });
                    }
                    window.dispatchEvent(new CustomEvent('celebrate_milestone', { detail: { count: weeklyCompletedCount } }));
                }
            }
        } catch (err: any) {
            console.error('Toggle task error:', err);
            // Revert on error
            setTasks(previousTasks);
            alert(`Failed to update task: ${err.message || 'Unknown error'}`);
        }
    };

    const toggleChecklistItem = async (taskId: string, itemId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.checklist) return;

        const updatedChecklist = task.checklist.map(item =>
            item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
        );

        await updateTask(taskId, { checklist: updatedChecklist });
    };

    const nudgePartner = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !user?.partner_id) return;

        // Broadcast nudge to partner's specific channel
        await supabase.channel(`nudge_${user.partner_id}`).send({
            type: 'broadcast',
            event: 'nudge',
            payload: { title: task.title, nudger: user.name }
        });

        alert("Partner nudged! 🔔");
    };
    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
            console.error('Delete task error:', error);
            alert('Failed to delete task.');
        }
    };
    return (
        <TaskContext.Provider value={{ tasks, addTask, updateTask, toggleTaskCompletion, toggleChecklistItem, nudgePartner, deleteTask, availableTags }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}
