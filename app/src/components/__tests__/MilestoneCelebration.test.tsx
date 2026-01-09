import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MilestoneCelebration } from '../MilestoneCelebration';
import { useAuth } from '../../context/AuthContext';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

describe('MilestoneCelebration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            user: {
                id: 'user1',
                name: 'User 1',
                avatar_url: 'https://example.com/me.png',
                partner: {
                    name: 'Partner 1',
                    avatar_url: 'https://example.com/partner.png'
                }
            },
        });
    });

    it('stays hidden initially', () => {
        render(<MilestoneCelebration />);
        expect(screen.queryByText(/YOU'RE KILLIN' IT!/i)).not.toBeInTheDocument();
    });

    it('shows and displays count when celebrate_milestone event is dispatched', async () => {
        render(<MilestoneCelebration />);

        await act(async () => {
            window.dispatchEvent(new CustomEvent('celebrate_milestone', { detail: { count: 10 } }));
        });

        expect(screen.getByText(/YOU'RE KILLIN' IT!/i)).toBeInTheDocument();
        expect(screen.getByText(/10 Tasks Completed Together This Week!/i)).toBeInTheDocument();
    });

    it('hides when "Keep it up" button is clicked', async () => {
        render(<MilestoneCelebration />);

        await act(async () => {
            window.dispatchEvent(new CustomEvent('celebrate_milestone', { detail: { count: 5 } }));
        });

        const closeBtn = screen.getByText(/Keep it up!/i);
        await act(async () => {
            closeBtn.click();
        });

        expect(screen.queryByText(/YOU'RE KILLIN' IT!/i)).not.toBeInTheDocument();
    });
});
