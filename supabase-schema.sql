-- ============================================================================
-- Minimalist Online Registration Form - Supabase PostgreSQL Schema
-- Database: Supabase PostgreSQL
-- Security: Row Level Security (RLS) enabled with strictly-scoped INSERT policy
-- ============================================================================

-- 1. Create the `registrations` table
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

-- 2. Index for created_at sorting and querying in administrative dashboard
CREATE INDEX IF NOT EXISTS idx_registrations_created_at 
    ON public.registrations(created_at DESC);

-- 3. Enable Row Level Security (RLS)
-- Crucial: Once RLS is enabled, all access is denied by default unless a policy explicitly grants it.
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 4. Create INSERT policy for anonymous visitors (public)
-- Allows any visitor (using the publishable/anon key) to insert their registration.
DROP POLICY IF EXISTS "Allow public insert only" ON public.registrations;
CREATE POLICY "Allow public insert only"
    ON public.registrations
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 5. Security confirmation: No SELECT, UPDATE, or DELETE policies are granted to 'anon'.
-- This guarantees that:
--   - Anonymous visitors CANNOT read/query any stored records.
--   - Anonymous visitors CANNOT modify or tamper with existing registrations.
--   - Anonymous visitors CANNOT delete any records.
-- Only authenticated administrators or the Supabase Service Role (inside Supabase Dashboard)
-- can view and manage stored customer data.

-- 6. Verification query (run after table creation to confirm structure)
COMMENT ON TABLE public.registrations IS 'Stores user registrations submitted via the minimalist registration form.';
