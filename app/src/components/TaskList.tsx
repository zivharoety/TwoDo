import { useState } from 'react';
import { ArrowDownUp, Filter, Tag } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { Task } from '../types';


interface TaskListProps {
    filter: (task: Task) => boolean;
    title: string;
    showNudge?: boolean;
    isMyList?: boolean;
}

type SortOption = 'created' | 'priority' | 'due_date';

export function TaskList({ filter, title, showNudge = false, isMyList = false }: TaskListProps) {
    const { tasks, toggleTaskCompletion, nudgePartner, availableTags } = useTasks();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('created');

    // Tag Filter State
    const [filterTag, setFilterTag] = useState<string>('all');

    // Shared Assignments Toggle
    const [showSharedAssignments, setShowSharedAssignments] = useState(false);

    const handleEdit = (task: Task) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTaskToEdit(null);
    };

    // Enhanced Filter Logic
    const effectiveFilter = (t: Task) => {
        // 1. Base filter (passed from App.tsx)
        // For MyList, this allows: (Private && CreatedByMe) OR (AssignedToMe)
        if (!filter(t)) return false;

        // 2. Tag Filter
        if (filterTag !== 'all' && (!t.tags || !t.tags.includes(filterTag))) {
            return false;
        }

        // 3. My List Specific: Hide shared assignments by default
        if (isMyList && !showSharedAssignments) {
            // User Request: "show only tasks that i open under me option"
            // "under me" tasks are those with visibility 'private'
            if (t.visibility !== 'private') {
                return false;
            }
        }
        return true;
    };

    const filteredTasks = tasks.filter(effectiveFilter);

    // Sorting
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        // 1. Past Due always comes first
        const aIsPastDue = a.status === 'past_due';
        const bIsPastDue = b.status === 'past_due';
        if (aIsPastDue && !bIsPastDue) return -1;
        if (!aIsPastDue && bIsPastDue) return 1;

        // 2. If both are same status group, apply user sort
        if (sortBy === 'priority') {
            const priorityWeights: Record<string, number> = { high: 3, medium: 2, low: 1 };
            const pDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
            if (pDiff !== 0) return pDiff;
        } else if (sortBy === 'due_date') {
            if (a.due_at && b.due_at) {
                const aTime = new Date(a.due_at).getTime();
                const bTime = new Date(b.due_at).getTime();
                if (aTime !== bTime) return aTime - bTime;
            } else if (a.due_at) return -1;
            else if (b.due_at) return 1;
        }

        // Default: sort by created date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const activeAndPastDueTasks = sortedTasks.filter(t => t.status === 'active' || t.status === 'past_due');
    const completedTasks = sortedTasks.filter(t => t.status === 'completed');

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h2>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Sort Selector */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                style={{
                                    appearance: 'none', background: 'var(--bg-card)', border: 'var(--glass-border)',
                                    color: 'var(--text-muted)', padding: '0.5rem 2rem 0.5rem 0.8rem',
                                    borderRadius: '12px', fontSize: '0.8rem', outline: 'none',
                                    minWidth: '100px'
                                }}
                            >
                                <option value="created">Newest</option>
                                <option value="priority">Priority</option>
                                <option value="due_date">Due Date</option>
                            </select>
                            <ArrowDownUp size={14} style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        </div>

                        {/* Tag Filter Selector */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                                style={{
                                    appearance: 'none', background: 'var(--bg-card)', border: 'var(--glass-border)',
                                    color: filterTag !== 'all' ? 'var(--primary)' : 'var(--text-muted)',
                                    padding: '0.5rem 2rem 0.5rem 0.8rem',
                                    borderRadius: '12px', fontSize: '0.8rem', outline: 'none',
                                    minWidth: '90px'
                                }}
                            >
                                <option value="all">All Tags</option>
                                {availableTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            <Tag size={13} style={{ position: 'absolute', right: '10px', top: '10px', pointerEvents: 'none', color: filterTag !== 'all' ? 'var(--primary)' : 'var(--text-muted)' }} />
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                background: 'var(--primary)', color: 'white', border: 'none',
                                width: '36px', height: '36px', borderRadius: '12px', fontSize: '1.5rem',
                                display: 'grid', placeItems: 'center', cursor: 'pointer',
                                boxShadow: '0 0 15px var(--primary-glow)'
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Toggle Button for Shared Assignments */}
                {isMyList && (
                    <button
                        onClick={() => setShowSharedAssignments(!showSharedAssignments)}
                        style={{
                            marginTop: '1rem', alignSelf: 'flex-start',
                            background: showSharedAssignments ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            border: '1px solid var(--border-color)',
                            color: showSharedAssignments ? 'var(--primary)' : 'var(--text-muted)',
                            padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Filter size={12} />
                        {showSharedAssignments ? 'Hide partner assignments' : 'Show partner assignments'}
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activeAndPastDueTasks.length === 0 && completedTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        {filterTag !== 'all' ? `No tasks found with tag "#${filterTag}"` : 'No tasks found. Time to relax! 🌴'}
                    </div>
                )}

                {/* Active & Past Due Tasks */}
                {activeAndPastDueTasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTaskCompletion}
                        onNudge={nudgePartner}
                        onEdit={handleEdit}
                        showNudge={showNudge}
                    />
                ))}

                {/* Separator if needed */}
                {completedTasks.length > 0 && activeAndPastDueTasks.length > 0 && (
                    <div style={{ margin: '1rem 0', height: '1px', background: 'var(--glass-border)' }} />
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>Completed</h3>
                        {completedTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onToggle={toggleTaskCompletion}
                                onNudge={nudgePartner}
                                onEdit={handleEdit}
                                showNudge={showNudge}
                            />
                        ))}
                    </>
                )}
            </div>

            <CreateTaskModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                taskToEdit={taskToEdit}
            />
        </div>
    );
}
