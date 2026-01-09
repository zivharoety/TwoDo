import { useState } from 'react';
import { Check, Clock, AlertTriangle, ChevronDown, ChevronUp, AlignLeft, Pencil } from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../utils/haptics';

interface TaskCardProps {
    task: Task;
    onToggle: (id: string) => void;
    onNudge: (id: string) => void;
    onEdit: (task: Task) => void;
    showNudge?: boolean;
}

export function TaskCard({ task, onToggle, onNudge, onEdit, showNudge = false }: TaskCardProps) {
    const { user } = useAuth();
    const { toggleChecklistItem } = useTasks();
    const [isExpanded, setIsExpanded] = useState(false);
    const isCompleted = task.status === 'completed';
    const isPastDue = task.status === 'past_due';

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isCompleted) {
            hapticFeedback.success();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ff2d55', '#fbbf24', '#34d399']
            });
        } else {
            hapticFeedback.medium();
        }
        onToggle(task.id);
    };

    const handleExpand = () => {
        if (hasExtraContent) {
            hapticFeedback.light();
            setIsExpanded(!isExpanded);
        }
    };

    const getPriorityClass = () => {
        if (isCompleted) return '';
        if (isPastDue) return 'past-due';

        switch (task.priority) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-med';
            case 'low': return 'priority-low';
            default: return '';
        }
    };

    // Border Color for Checkbox
    const getCheckboxBorder = () => {
        if (isCompleted) return 'var(--primary)';
        if (isPastDue) return '#ef4444'; // Red
        return 'rgba(255,255,255,0.2)';
    }

    const hasExtraContent = !!(task.description || (task.checklist && task.checklist.length > 0) || task.image_url);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isCompleted ? 0.6 : 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ scale: 1.01 }}
            className={`glass-panel ${getPriorityClass()}`}
            onClick={handleExpand}
            style={{
                padding: '1rem 1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
                cursor: hasExtraContent ? 'pointer' : 'default'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                {/* Checkbox */}
                <motion.div
                    onClick={handleToggle}
                    whileTap={{ scale: 0.8 }}
                    style={{
                        width: '24px', height: '24px', borderRadius: '8px',
                        border: `2px solid ${isCompleted ? 'transparent' : getCheckboxBorder()}`,
                        display: 'grid', placeItems: 'center',
                        background: isCompleted ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        boxShadow: isCompleted ? '0 0 10px var(--primary)' : 'none'
                    }}
                >
                    {isCompleted && <Check size={14} color="white" strokeWidth={4} />}
                </motion.div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 500,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '0.01em',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {task.title}
                    </h3>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && !isExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.4rem' }}>
                            {task.tags.map(tag => (
                                <span key={tag} style={{
                                    fontSize: '0.65rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    letterSpacing: '0.02em'
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Date Row */}
                    {task.due_at && !isCompleted && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem', opacity: 0.8, color: isPastDue ? '#fca5a5' : 'var(--text-muted)' }}>
                            {isPastDue ? <AlertTriangle size={12} color="#fca5a5" /> : <Clock size={12} />}
                            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {isPastDue ? 'Overdue: ' : ''}
                                {format(new Date(task.due_at), 'MMM d, h:mm a')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Side: Nudge/Assignee/Chevron */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isCompleted && task.visibility === 'shared' && task.assignee_id && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '2px'
                        }}>
                            <div style={{
                                fontSize: '0.65rem',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                background: task.assignee_id === user?.id ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                color: task.assignee_id === user?.id ? 'var(--primary)' : 'var(--text-muted)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {task.assignee_id === user?.id ? 'Me' : 'Partner'}
                            </div>
                            {task.assignee_id === user?.id && task.creator_id !== user?.id && (
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                                    from Partner
                                </span>
                            )}
                        </div>
                    )}

                    {!isCompleted && showNudge && task.assignee_id !== user?.id && (
                        <motion.button
                            className="btn-primary"
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                hapticFeedback.medium();
                                onNudge(task.id);
                            }}
                            style={{
                                padding: '0.4rem 0.8rem',
                                fontSize: '0.7rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                boxShadow: 'none',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-muted)',
                                fontWeight: 500
                            }}
                        >
                            Nudge
                        </motion.button>
                    )}
                    {!isCompleted && (
                        <motion.button
                            whileTap={{ scale: 0.8, rotate: -15 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                hapticFeedback.light();
                                onEdit(task);
                            }}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', padding: '4px', display: 'flex'
                            }}
                        >
                            <Pencil size={14} />
                        </motion.button>
                    )}

                    {hasExtraContent && (
                        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingLeft: '2.5rem', paddingBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Image */}
                            {task.image_url && (
                                <img
                                    src={task.image_url}
                                    alt="Task"
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        objectFit: 'cover',
                                        maxHeight: '180px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                />
                            )}

                            {/* Tags (moved here when expanded) */}
                            {task.tags && task.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {task.tags.map(tag => (
                                        <span key={tag} style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: 'rgba(129, 140, 248, 0.1)',
                                            color: 'var(--primary)',
                                            border: '1px solid rgba(129, 140, 248, 0.2)',
                                        }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            {task.description && (
                                <div style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)' }}>
                                    <AlignLeft size={14} style={{ flexShrink: 0, marginTop: '3px' }} />
                                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)' }}>
                                        {task.description}
                                    </p>
                                </div>
                            )}

                            {/* Checklist */}
                            {task.checklist && task.checklist.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {task.checklist.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={(e) => { e.stopPropagation(); toggleChecklistItem(task.id, item.id); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                            >
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '5px',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    display: 'grid', placeItems: 'center',
                                                    background: item.is_completed ? 'var(--primary)' : 'rgba(0,0,0,0.2)',
                                                    transition: 'all 0.2s',
                                                    flexShrink: 0
                                                }}>
                                                    {item.is_completed && <Check size={12} color="white" strokeWidth={4} />}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.9rem',
                                                    color: item.is_completed ? 'var(--text-muted)' : 'white',
                                                    textDecoration: item.is_completed ? 'line-through' : 'none',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}
