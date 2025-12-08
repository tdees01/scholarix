
-- Drop the existing table and recreate it with uuid as primary key
DROP TABLE IF EXISTS public.profile CASCADE;

CREATE TABLE public.profile (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT ''::text,
  major text DEFAULT ''::text,
  gpa real,
  gradYear numeric NOT NULL,
  selectedInterests text DEFAULT ''::text,
  classification text,
  CONSTRAINT profile_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can read their own profile
CREATE POLICY "read_own_profile"
ON public.profile
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can insert their own profile (first time)
CREATE POLICY "insert_own_profile"
ON public.profile
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "update_own_profile"
ON public.profile
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());