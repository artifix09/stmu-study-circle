-- Add new columns to study_groups table
ALTER TABLE public.study_groups
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS course_code TEXT,
ADD COLUMN IF NOT EXISTS study_topics TEXT[],
ADD COLUMN IF NOT EXISTS meeting_days TEXT[],
ADD COLUMN IF NOT EXISTS meeting_time TIME,
ADD COLUMN IF NOT EXISTS meeting_location TEXT;

-- Add constraint for max_members to be between 3 and 10
ALTER TABLE public.study_groups
DROP CONSTRAINT IF EXISTS study_groups_max_members_check;

ALTER TABLE public.study_groups
ADD CONSTRAINT study_groups_max_members_check 
CHECK (max_members IS NULL OR (max_members >= 3 AND max_members <= 10));

-- Update RLS policies for better group management
DROP POLICY IF EXISTS "Anyone can view public groups" ON public.study_groups;

CREATE POLICY "Anyone can view public groups"
ON public.study_groups
FOR SELECT
TO authenticated
USING (
  visibility = 'public' 
  OR creator_id = auth.uid() 
  OR is_group_member(auth.uid(), id)
);

-- Ensure admins can update group details
DROP POLICY IF EXISTS "Creators can update their groups" ON public.study_groups;

CREATE POLICY "Admins can update their groups"
ON public.study_groups
FOR UPDATE
TO authenticated
USING (is_group_admin(auth.uid(), id))
WITH CHECK (is_group_admin(auth.uid(), id));