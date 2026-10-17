# Minimalist Online Registration Form

A clean, responsive, and secure online registration website built with **HTML5, CSS3, vanilla JavaScript**, and **Supabase PostgreSQL**.

Designed with a modern, minimalist aesthetic (centered card, subtle shadows, refined indigo accent), robust client-side & database-side validation, full accessibility (ARIA, focus rings), and locked-down Row Level Security (RLS).

---

## 1. Project Structure

```text
Minimal_Form/
├── index.html            # Semantic HTML5 structure with form fields & status cards
├── style.css             # Minimalist styling, variables, animations, and responsive layout
├── script.js             # Form validation, future date restriction, and Supabase JS client
├── supabase-schema.sql   # SQL statements for table creation, constraints, and RLS policies
└── README.md             # Complete setup, deployment, and testing documentation
```

---

## 2. Technology Stack & Key Highlights

- **Frontend**: HTML5, CSS3 (Vanilla CSS with design tokens), and Vanilla JavaScript (ES6+).
- **Database**: Supabase PostgreSQL.
- **Client Library**: `@supabase/supabase-js` v2 (via official CDN).
- **Backend**: Serverless static architecture — zero Node.js, Python, or custom servers required.
- **Hosting Targets**: GitHub Pages or Netlify.

---

## 3. Database Setup (Supabase PostgreSQL)

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project**, choose an organization, assign a project name (e.g. `minimalist-form`), and set a strong database password.
3. Select the region closest to your users and click **Create new project**.

### Step 2: Run the SQL Schema
1. In your Supabase Dashboard, navigate to the **SQL Editor** (terminal icon in the left sidebar).
2. Click **New Query**.
3. Copy and paste the contents of [`supabase-schema.sql`](file:///c:/Users/sanjay/OneDrive/Desktop/PROJECT/Minimal_Form/supabase-schema.sql) (or the block below) into the query editor:

```sql
-- 1. Create the registrations table with constraints
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    dob DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Database-level validation constraints
    CONSTRAINT username_length_check CHECK (char_length(trim(username)) >= 2 AND char_length(username) <= 50),
    CONSTRAINT email_format_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT dob_not_future_check CHECK (dob <= CURRENT_DATE),
    CONSTRAINT dob_reasonable_check CHECK (dob >= '1900-01-01')
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_registrations_created_at 
    ON public.registrations(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. Create an INSERT-only policy for anonymous visitors (public)
DROP POLICY IF EXISTS "Allow public insert only" ON public.registrations;
CREATE POLICY "Allow public insert only"
    ON public.registrations
    FOR INSERT
    TO anon
    WITH CHECK (true);
```
4. Click **Run** (or `Ctrl + Enter`). Verify that the output confirms success (`Success. No rows returned`).

---

## 4. Frontend Configuration

1. In your Supabase Dashboard, go to **Project Settings** (gear icon) &rarr; **API**.
2. Locate the following two values under **Project API keys** and **Project URL**:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys**: Copy the **`anon` / `public`** key.
   > [!CAUTION]
   > **Never** expose the `service_role` secret key in frontend code. Use only the `anon` / `public` key. Row Level Security ensures the `anon` key can only perform inserts and cannot read or tamper with submitted data.
3. Open [`script.js`](file:///c:/Users/sanjay/OneDrive/Desktop/PROJECT/Minimal_Form/script.js) and replace the placeholder values at the top:

```javascript
// Replace these placeholders with your actual values:
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

4. Save the file.

---

## 5. Security Architecture

1. **Row Level Security (RLS)**:
   - RLS is explicitly enabled on the `registrations` table.
   - The only policy granted to the `anon` role is `INSERT`.
   - Anonymous visitors **cannot** execute `SELECT` queries to view other users' submissions, nor can they `UPDATE` or `DELETE` existing entries.
2. **Dual-Layer Validation**:
   - **Client-Side**: Immediate feedback preventing empty submissions, malformed emails, invalid usernames, and future dates of birth.
   - **Database-Side**: PostgreSQL `CHECK` constraints reject invalid data at the database level even if a user bypasses client JavaScript.
3. **No Secret Keys**:
   - The frontend communicates directly with Supabase via the restricted `anon` key. No administrative tokens or credentials are leaked.

---

## 6. Step-by-Step Deployment Instructions

### Option A: Deploy to GitHub Pages (Recommended)

1. Initialize a git repository and commit your files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: minimalist registration form"
   ```
2. Create a new repository on GitHub (e.g. `minimalist-registration`).
3. Link your local repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/minimalist-registration.git
   git branch -M main
   git push -u origin main
   ```
4. On GitHub, navigate to **Settings** &rarr; **Pages** (under the "Code and automation" section).
5. Under **Build and deployment** &rarr; **Source**, select **Deploy from a branch**.
6. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
7. Wait 1–2 minutes. GitHub will provide your live URL: `https://YOUR_USERNAME.github.io/minimalist-registration/`.

---

### Option B: Deploy to Netlify

#### Method 1: Netlify Drag & Drop (Fastest — 30 seconds)
1. Go to [Netlify](https://app.netlify.com/).
2. Log in or create a free account.
3. Navigate to **Sites** and locate the **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"** area.
4. Drag and drop the `Minimal_Form` folder into the browser window.
5. Netlify will immediately upload and deploy the static site, assigning a live URL (e.g., `https://stellar-registration.netlify.app`).

#### Method 2: Netlify via Git Repository
1. In Netlify, click **Add new site** &rarr; **Import an existing project**.
2. Connect to GitHub and select your repository.
3. Keep the build settings blank (Build command: empty, Publish directory: `./` or blank).
4. Click **Deploy minimalist-registration**.

---

## 7. Verification & Test Checklist

Use this checklist to thoroughly test the form and verify that submitted data persists in Supabase:

- [ ] **1. Future Date Prevention (Client Picker)**:
  - Open the date picker.
  - Confirm dates after today are disabled/unclickable in the native calendar.
  - Manually type a future date (e.g. `2099-01-01`) and click Submit. Verify error message: *"Date of birth cannot be in the future."*
- [ ] **2. Email Validation**:
  - Enter an invalid email (e.g. `test@`, `invalid.com`, or `abc@xyz`).
  - Click Submit. Verify error message: *"Please enter a valid email address."*
- [ ] **3. Username Validation**:
  - Enter a 1-character username. Verify error message: *"Username must be at least 2 characters."*
  - Enter an empty username. Verify error message: *"Username is required."*
- [ ] **4. Loading State Feedback**:
  - Click Submit with valid inputs.
  - Verify that the button is disabled, the spinner appears, and the text changes to *"Registering..."* to prevent duplicate submissions.
- [ ] **5. Database Confirmation & Form Reset**:
  - Upon submission, verify the green *"Registration Successful!"* card appears below the form.
  - Verify that the form fields reset back to clean, empty states.
- [ ] **6. Supabase Persistence Check**:
  - In your Supabase Dashboard, go to **Table Editor** &rarr; `registrations`.
  - Confirm the newly inserted row appears with `id`, `username`, `email`, `dob`, and `created_at`.
- [ ] **7. Refresh / Persistence Test**:
  - Reload the browser page (`F5` or `Ctrl + R`).
  - Open Supabase Table Editor again to verify the record is still present.
- [ ] **8. Security / RLS Protection Check**:
  - Open the browser's developer console (`F12`).
  - Run the following command:
    ```javascript
    supabaseClient.from('registrations').select('*').then(console.log);
    ```
  - Confirm that the response data returns an empty array `[]` (no rows) due to Row Level Security, ensuring anonymous visitors cannot read submitted data.
