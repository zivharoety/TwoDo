import { useState, useEffect } from 'react';
import { X, Calendar, Plus, Tag as TagIcon, User as UserIcon, Users, AlignLeft, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Priority, Visibility, Task } from '../types';
import { differenceInDays } from 'date-fns';
import { hapticFeedback } from '../utils/haptics';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskToEdit?: Task | null;
}

export function CreateTaskModal({ isOpen, onClose, taskToEdit }: CreateTaskModalProps) {
    const { addTask, updateTask, deleteTask, availableTags } = useTasks();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority>('low');
    const [assignScope, setAssignScope] = useState<'me' | 'shared'>('me');
    const [sharedAssignee, setSharedAssignee] = useState<'me' | 'partner'>('me');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [checklist, setChecklist] = useState<string[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [image, setImage] = useState<string | null>(null);

    // Tag State
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState('');
    const [isTagInputVisible, setIsTagInputVisible] = useState(false);

    // Populate for Edit Mode
    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setPriority(taskToEdit.priority);
            setAssignScope(taskToEdit.visibility === 'shared' ? 'shared' : 'me');

            if (taskToEdit.visibility === 'shared') {
                if (taskToEdit.assignee_id === user?.id) setSharedAssignee('me');
                else setSharedAssignee('partner');
            } else {
                setSharedAssignee('me');
            }

            setDueDate(taskToEdit.due_at ? taskToEdit.due_at.split('T')[0] : '');
            setDescription(taskToEdit.description || '');
            setChecklist(taskToEdit.checklist?.map((i: any) => i.text) || []);
            setImage(taskToEdit.image_url || null);
            setSelectedTags(taskToEdit.tags || []);
        } else {
            // Reset to defaults if not editing
            setTitle('');
            setPriority('low');
            setAssignScope('me');
            setSharedAssignee('me');
            setDueDate('');
            setDescription('');
            setChecklist([]);
            setImage(null);
            setSelectedTags([]);
        }
    }, [taskToEdit, isOpen]);

    // Auto-Priority Logic based on Due Date
    useEffect(() => {
        if (!dueDate || taskToEdit) return; // Don't auto-override if editing or no date
        const daysUntilDue = differenceInDays(new Date(dueDate), new Date());
        if (daysUntilDue <= 3) {
            setPriority('high');
        } else if (daysUntilDue <= 7) {
            setPriority('medium');
        } else {
            setPriority('low');
        }
    }, [dueDate, taskToEdit]);

    const addChecklistItem = () => {
        if (newChecklistItem.trim()) {
            hapticFeedback.light();
            setChecklist([...checklist, newChecklistItem.trim()]);
            setNewChecklistItem('');
        }
    };

    const removeChecklistItem = (index: number) => {
        hapticFeedback.light();
        setChecklist(checklist.filter((_, i) => i !== index));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            hapticFeedback.medium();
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !user || isSubmitting) return;

        setIsSubmitting(true);
        hapticFeedback.success();

        let visibility: Visibility = 'private';
        let assignee_id = user.id; // Default to me for private tasks

        if (assignScope === 'shared') {
            visibility = 'shared';
            assignee_id = sharedAssignee === 'me' ? user.id : (user.partner_id || user.id);

            if (!user.partner_id && sharedAssignee === 'partner') {
                alert("You haven't linked with a partner yet! This task will be assigned to you until you link with someone.");
                assignee_id = user.id;
            }
        }

        const taskData = {
            title,
            description: description.trim() || undefined,
            priority,
            visibility,
            assignee_id,
            due_at: dueDate ? new Date(dueDate).toISOString() : undefined,
            tags: selectedTags,
            checklist: checklist.map((text) => {
                // Keep existing IDs if it's an edit, or generate new ones
                const existingItem = taskToEdit?.checklist?.find((i: any) => i.text === text);
                return {
                    id: existingItem?.id || crypto.randomUUID(),
                    text,
                    is_completed: existingItem?.is_completed || false
                };
            }),
            image_url: image || undefined
        };

        try {
            if (taskToEdit) {
                await updateTask(taskToEdit.id, taskData);
            } else {
                await addTask({
                    ...taskData,
                    creator_id: user.id
                });
            }
            onClose();
        } catch (err: any) {
            console.error('Submit error:', err);
            // Even if it fails, TaskContext will revert the optimistic update.
            // We alert the user so they know it didn't save on the server.
            alert(`Failed to save task: ${err.message || 'Check your database connection'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!taskToEdit) return;
        hapticFeedback.warning();
        if (window.confirm('Are you sure you want to delete this task?')) {
            await deleteTask(taskToEdit.id);
            onClose();
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const addNewTag = () => {
        if (newTagInput.trim() && !selectedTags.includes(newTagInput.trim())) {
            setSelectedTags([...selectedTags, newTagInput.trim()]);
        }
        setNewTagInput('');
        setIsTagInputVisible(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            zIndex: 100, backdropFilter: 'blur(4px)'
                        }}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="glass-panel"
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                            borderRadius: '24px 24px 0 0', padding: '1.5rem', borderBottom: 'none',
                            maxHeight: '92vh', overflowY: 'auto',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>{taskToEdit ? 'Edit Task' : 'New Task'}</h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Scope Selection */}
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
                                <button
                                    type="button"
                                    onClick={() => { hapticFeedback.light(); setAssignScope('me'); }}
                                    style={{
                                        flex: 1,
                                        background: assignScope === 'me' ? 'var(--bg-card)' : 'transparent',
                                        border: 'none',
                                        padding: '0.6rem',
                                        borderRadius: '8px',
                                        color: assignScope === 'me' ? 'white' : 'var(--text-muted)',
                                        textTransform: 'capitalize',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <UserIcon size={16} /> Me
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { hapticFeedback.light(); setAssignScope('shared'); }}
                                    style={{
                                        flex: 1,
                                        background: assignScope === 'shared' ? 'var(--bg-card)' : 'transparent',
                                        border: 'none',
                                        padding: '0.6rem',
                                        borderRadius: '8px',
                                        color: assignScope === 'shared' ? 'white' : 'var(--text-muted)',
                                        textTransform: 'capitalize',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Users size={16} /> Shared
                                </button>
                            </div>

                            {/* Assignment Selector - ONLY If Shared is selected */}
                            {assignScope === 'shared' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Assign To:</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {[
                                            { id: 'me', label: 'Me' },
                                            { id: 'partner', label: 'Partner' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => { hapticFeedback.light(); setSharedAssignee(opt.id as any); }}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: sharedAssignee === opt.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                                    background: sharedAssignee === opt.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                    color: sharedAssignee === opt.id ? 'var(--primary)' : 'var(--text-muted)',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <input
                                autoFocus
                                type="text"
                                placeholder="What needs doing?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--border-color)',
                                    padding: '0.5rem 0',
                                    fontSize: '1.2rem',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            />

                            {/* Tags moved under title */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <TagIcon size={12} /> Tags
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {availableTags.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            style={{
                                                background: selectedTags.includes(tag) ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                    {selectedTags.filter(t => !availableTags.includes(t)).map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            style={{
                                                background: 'var(--primary)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                    {!isTagInputVisible ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsTagInputVisible(true)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px dashed var(--text-muted)',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '12px',
                                                color: 'var(--text-muted)',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            <Plus size={12} /> New
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                            <input
                                                type="text"
                                                value={newTagInput}
                                                onChange={(e) => setNewTagInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewTag(); } }}
                                                onBlur={() => { if (newTagInput) addNewTag(); else setIsTagInputVisible(false); }}
                                                placeholder="Tag name..."
                                                autoFocus
                                                style={{
                                                    background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '8px',
                                                    padding: '0.3rem 0.6rem', color: 'white', fontSize: '0.8rem', outline: 'none', minWidth: '80px'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlignLeft size={12} /> Description
                                </label>
                                <textarea
                                    placeholder="Add details..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '0.8rem',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        outline: 'none',
                                        minHeight: '60px',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            {/* Checklist */}
                            <div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {checklist.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px' }}>
                                            <span style={{ flex: 1, fontSize: '0.9rem' }}>{item}</span>
                                            <button type="button" onClick={() => removeChecklistItem(index)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="Add checklist item..."
                                            value={newChecklistItem}
                                            onChange={(e) => setNewChecklistItem(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: '1px solid var(--border-color)',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                padding: '4px 0'
                                            }}
                                        />
                                        <button type="button" onClick={addChecklistItem} style={{ background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', padding: '2px 8px', cursor: 'pointer' }}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Image Attachment (Simulator) */}
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ImageIcon size={12} /> Photo
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {image ? (
                                        <div style={{ position: 'relative', width: 'fit-content' }}>
                                            <img
                                                src={image}
                                                alt="Preview"
                                                style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setImage(null)}
                                                style={{
                                                    position: 'absolute', top: '-8px', right: '-8px',
                                                    background: '#ff4444', color: 'white', border: 'none',
                                                    borderRadius: '50%', width: '20px', height: '20px',
                                                    display: 'grid', placeItems: 'center', cursor: 'pointer',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label style={{
                                            width: '100%',
                                            height: '60px',
                                            border: '1px dashed var(--border-color)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.02)',
                                            fontSize: '0.9rem'
                                        }}>
                                            <Plus size={16} /> Upload from device
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>



                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Priority</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {(['low', 'medium', 'high'] as const).map(p => {
                                            const getColor = (lvl: Priority) => {
                                                if (lvl === 'high') return 'var(--p-high)';
                                                if (lvl === 'medium') return 'var(--p-med)';
                                                return 'var(--p-low)';
                                            };
                                            return (
                                                <label key={p} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                                                    <input
                                                        type="radio"
                                                        name="priority"
                                                        value={p}
                                                        checked={priority === p}
                                                        onChange={() => { hapticFeedback.light(); setPriority(p); }}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        border: priority === p ? `2px solid ${getColor(p)}` : '1px solid var(--border-color)',
                                                        background: priority === p ? 'rgba(255,255,255,0.05)' : 'transparent',
                                                        display: 'grid', placeItems: 'center',
                                                        transition: 'all 0.2s',
                                                        boxShadow: priority === p ? `0 0 10px ${getColor(p)}` : 'none'
                                                    }}>
                                                        <div style={{
                                                            width: '12px', height: '12px', borderRadius: '50%',
                                                            background: getColor(p),
                                                            boxShadow: `0 0 5px ${getColor(p)}`
                                                        }} />
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Due Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border-color)',
                                                padding: '0.6rem',
                                                borderRadius: '12px',
                                                color: 'white',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                colorScheme: 'dark'
                                            }}
                                        />
                                        {!dueDate && (
                                            <Calendar size={16} color="gray" style={{ position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none' }} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                                {taskToEdit && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        style={{
                                            flex: '0 0 auto',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '1rem', fontSize: '1rem', opacity: isSubmitting ? 0.7 : 1 }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : (taskToEdit ? 'Update Task' : 'Create Task')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
