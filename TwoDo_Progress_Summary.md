# TwoDo Project Progress Summary
**Date:** January 6, 2026

## 1. Project Overview
**TwoDo** is a premium, shared task management app for couples. We have successfully built the frontend core with a high-fidelity "Neon Glass" aesthetic and advanced local state management.

## 2. Current Implementation Status

### 🎨 UI & Design (Completed)
*   **Aesthetic**: Implemented a "Neon Glass" theme.
    *   Deep dark blue/slate background.
    *   Glassmorphism cards with multi-stop gradients and reflective borders.
    *   **Priority Glows**: Tasks glow with specific neon colors (Ruby Red, Amber, Emerald) based on priority.
*   **Navigation**: Streamlined bottom bar with **My List**, **Shared**, and **History**.

### 🛠 Core Features (Frontend Built)
*   **Task Creation**:
    *   **Scoping**: Create "Private" tasks or "Shared" tasks.
    *   **Assignment**: When sharing, option to assign to "Me", "Partner", or leave "Unassigned".
    *   **Auto-Priority**: Priority defaults based on due date (>7 days = Low, <=7 days = Med, <=3 days = High).
    *   **Tags**: Ability to create new tags on the fly or select from previously used ones.
*   **Task Management**:
    *   **Sorting**: Sort by Newest, Priority, or Due Date.
    *   **Filtering**:
        *   "My List" shows your private tasks + tasks assigned to you.
        *   **Toggle**: Button to show/hide tasks assigned to you by your partner in "My List".
    *   **Interaction**: Checkboxes with confetti celebration, "Nudge" button for shared tasks.
*   **Data Model**:
    *   Types defined for `Task`, `User`, `Priority`, `Visibility`.
    *   Mock data implementation via `TaskContext`.

### 📱 Components Refined
*   **TaskCard**: Displays Title, Tags, Due Date (date + time), and glowing priority border. "Nudge" button available only on shared/partner items.
*   **CreateTaskModal**: Polished form with date picker, tag input, and visual priority selector.

## 3. Pending / Next Steps

### 🔌 Backend Integration (Critical Next Step)
*   **Supabase Setup**: Connect the app to a real Supabase backend.
*   **Authentication**: Replace mock auth with real Google OAuth.
*   **Database**: Create tables for `profiles`, `tasks`, and `couples`.

### 👥 Partner Features
*   **Linking Flow**: Build screens to invite a partner (via code/link) and link accounts in the DB.
*   **Real-time Sync**: Ensure tasks update instantly on both devices.

### 🚀 Deployment
*   Deploy frontend to Vercel.
*   Configure environment variables.

## 4. How to Resume
To continue development, the immediate next step is **connecting the database**.
1.  Set up a Supabase project.
2.  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
3.  Implement the auth logic in `AuthContext.tsx`.
