# Deploying TwoDo 🚀

To use TwoDo with your partner, follow these steps to deploy your application to **Vercel** (recommended) or any other static hosting service.

## 1. Deploy to Vercel (Easiest)

1. **Push your code to GitHub/GitLab/Bitbucket**:
   If you haven't already, push your current project to a repository.

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in.
   - Click **Add New** -> **Project**.
   - Import your repository.

3. **Configure Settings**:
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: `app` (Make sure to select the `app` folder if your repo is at the root).
   - **Build Command**: `npm run build`.
   - **Output Directory**: `dist`.

4. **Environment Variables**:
   In the "Environment Variables" section of the Vercel project setup, add the following from your `.env` file:
   - `VITE_SUPABASE_URL`: Your Supabase URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

5. **Deploy**:
   Click **Deploy**. Vercel will give you a production URL (e.g., `https://twodo-app.vercel.app`).

---

## 2. Important: Update Supabase Settings

Since you are using Google Auth, you **must** tell Supabase about your new production URL:

1. Go to your [Supabase Dashboard](https://app.supabase.com).
2. Go to **Authentication** -> **URL Configuration**.
3. In **Site URL**, you can put your production Vercel URL.
4. In **Redirect URLs**, add your Vercel URL (e.g., `https://twodo-app.vercel.app`).
   *Note: If you are testing locally, keep `http://localhost:5173` there as well.*

---

## 3. Inviting Your Partner

Once deployed:
1. Copy your production URL and send it to your partner.
2. Ask them to sign in.
3. Once they sign in, they will have their own account.
4. To link accounts, ensure you both have used the "Partner" features in the app (e.g., matching emails if that's how your backend handles it).

*Note: The current schema uses `partner_id` in the `profiles` table. You may need to manually link your IDs in the Supabase dashboard or use an invitation flow if implemented.*
