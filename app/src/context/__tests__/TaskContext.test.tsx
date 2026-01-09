import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskProvider, useTasks } from '../TaskContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../AuthContext';
import React from 'react';

// Mock AuthContext
vi.mock('../AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { id: 'new-task' }, error: null })),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        })),
        removeChannel: vi.fn(),
    },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TaskProvider>{children}</TaskProvider>
);

describe('TaskContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: { id: 'user1', partner_id: 'partner1', name: 'User 1' },
        });
    });

    it('fetches tasks on mount', async () => {
        const mockTasks = [{ id: '1', title: 'Task 1', status: 'active' }];
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
            }),
        });

        const { result } = renderHook(() => useTasks(), { wrapper });

        // Wait for useEffect to fire
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.tasks).toEqual(mockTasks);
    });

    it('triggers milestone celebration on 5th task completion', async () => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // 4 tasks already completed this week
        const mockTasks = [
            { id: '1', status: 'completed', completed_at: new Date().toISOString() },
            { id: '2', status: 'completed', completed_at: new Date().toISOString() },
            { id: '3', status: 'completed', completed_at: new Date().toISOString() },
            { id: '4', status: 'completed', completed_at: new Date().toISOString() },
            { id: '5', status: 'active', title: 'The 5th Task' },
        ];

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockTasks, error: null }),
            }),
            update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
            }),
        });

        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        const { result } = renderHook(() => useTasks(), { wrapper });

        // Wait for fetch
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Toggle the 5th task
        await act(async () => {
            await result.current.toggleTaskCompletion('5');
        });

        // Check if event was dispatched
        const milestoneEvent = dispatchSpy.mock.calls.find(
            call => call[0] instanceof CustomEvent && call[0].type === 'celebrate_milestone'
        );
        expect(milestoneEvent).toBeDefined();
        expect((milestoneEvent![0] as CustomEvent).detail).toEqual({ count: 5 });
    });
});
