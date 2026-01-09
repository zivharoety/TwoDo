export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed' | 'past_due';
export type Visibility = 'private' | 'shared';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    partner_id?: string;
    partner?: {
        name: string;
        avatar_url: string;
        email: string;
    };
}

export interface ChecklistItem {
    id: string;
    text: string;
    is_completed: boolean;
}

export interface Task {
    id: string;
    created_at: string;
    completed_at?: string;
    creator_id: string;
    assignee_id?: string;
    visibility: Visibility;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    due_at?: string; // ISO date string
    image_url?: string;
    tags?: string[];
    checklist?: ChecklistItem[];
}
