import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCard } from '../TaskCard';
import { Task } from '../../types';

// Mock contexts
vi.mock('../../context/TaskContext', () => ({
    useTasks: () => ({
        toggleChecklistItem: vi.fn(),
    }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user1' },
    }),
}));

// Mock utils and external libs
vi.mock('../../utils/haptics', () => ({
    hapticFeedback: {
        success: vi.fn(),
        medium: vi.fn(),
        light: vi.fn(),
    },
}));

vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'active',
    priority: 'high',
    visibility: 'private',
    creator_id: 'user1',
    created_at: new Date().toISOString(),
    tags: ['urgent'],
    checklist: [],
};

describe('TaskCard', () => {
    const defaultProps = {
        task: mockTask,
        onToggle: vi.fn(),
        onNudge: vi.fn(),
        onEdit: vi.fn(),
    };

    it('renders task title correctly', () => {
        render(<TaskCard {...defaultProps} />);
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('renders tags when provided', () => {
        render(<TaskCard {...defaultProps} />);
        expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('calls onToggle when checkbox is clicked', () => {
        render(<TaskCard {...defaultProps} />);
        // Actually, the toggle is the first motion.div inside the main div.
        // Let's find it by some other means or just rely on the click behavior.

        // The title is clickable for expansion, but the checklist toggle is specific.
        const checkboxEl = screen.getByText('Test Task').parentElement?.parentElement?.firstChild;
        if (checkboxEl) {
            fireEvent.click(checkboxEl);
        }
        expect(defaultProps.onToggle).toHaveBeenCalledWith('1');
    });

    it('shows "Me" label if assigned to current user', () => {
        const assignedTask = { ...mockTask, visibility: 'shared', assignee_id: 'user1' } as Task;
        render(<TaskCard {...defaultProps} task={assignedTask} />);
        expect(screen.getByText('Me')).toBeInTheDocument();
    });

    it('shows "Partner" label if assigned to someone else', () => {
        const assignedTask = { ...mockTask, visibility: 'shared', assignee_id: 'user2' } as Task;
        render(<TaskCard {...defaultProps} task={assignedTask} />);
        expect(screen.getByText('Partner')).toBeInTheDocument();
    });

    it('expands when clicked (if it has extra content)', () => {
        render(<TaskCard {...defaultProps} />);
        fireEvent.click(screen.getByText('Test Task'));
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
});
