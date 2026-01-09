# Product Requirements Document (PRD): TwoDo

**Version:** 1.4  
**Status:** Ready for Development  
**Lead Developer:** antiGravity  

---

## 1. Project Overview
**TwoDo** is a streamlined, private task management web app built for a couple. It features a "Hybrid Privacy" model where users can manage private tasks, shared tasks, and tasks assigned to their partner.

## 2. Authentication & Security
* **Sign-In:** Google OAuth 2.0.
* **Profile:** Automatically pull Name and Avatar from Google.
* **Linking:** Mechanism to link two specific users as "Partners."
* **Security:** Row-Level Security (RLS) to ensure data privacy between couples.

## 3. UI/UX Requirements
* **Platform:** Mobile-First Web App (Responsive).
* **Theme:** System-adaptive Light/Dark mode.
* **Navigation:** Bottom Tab Bar (My List | Shared | Partner | History).
* **Interactions:** Checkboxes for completion; Nudge button for reminders.
* **UI Reviews:** Developer must show UI/UX mockups for approval during the process.

## 4. Functional Scope
* **Task Attributes:** Title, Description, Checklists, Priority, Due Dates, Image Attachments.
* **Status Logic:** Tasks move from `active` to `past due` automatically if the deadline passes without completion.
* **Syncing:** Real-time database updates across both devices.
* **Celebrations:** * Confetti animation on every task completion.
    * Partner notification + major animation after 5 tasks completed in a week.
* **Nudges:** One-tap push notification to "ping" the partner about an assigned task.
* **Deadline Watchdog:** Automatic alert to the creator if an assigned task becomes `past due`.

## 5. Deployment & Process
**Note to Developer (antiGravity):** This is a "Turnkey" request.

1. **Milestones:** Provide visual UI previews before final code implementation.
2. **Deployment:** Handle the full setup (Vercel + Supabase/Firebase).
3. **Environment:** Configure Google Cloud Console for OAuth.
4. **Communication:** Reach out immediately for any necessary API keys, assets, or billing setups.
5. **Final Deliverable:** A live URL for immediate use.

---

## 6. Technical Reference (Data Schema)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique Task ID |
| `creator_id` | UUID | Links to User Profile |
| `assignee_id` | UUID | Links to User or "Shared" |
| `visibility` | Enum | `private` or `shared` |
| `title` | String | Task name |
| `status` | Enum | `active`, `completed`, or `past due` |
| `due_at` | Timestamp | Deadline |
| `priority` | Int | 1 (Low) to 3 (High) |
| `image_url` | String | URL to Cloud Storage |