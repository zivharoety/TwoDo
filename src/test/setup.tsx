import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});

// Mock framer-motion to bypass animations in tests
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        motion: {
            div: 'div',
            button: 'button',
            h1: 'h1',
            h2: 'h2',
            span: 'span',
            section: 'section',
            nav: 'nav',
            p: 'p',
            svg: 'svg',
            path: 'path',
            label: 'label',
            input: 'input',
            textarea: 'textarea',
            img: 'img',
        },
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});
