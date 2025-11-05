-- Create group goals table
CREATE TABLE public.group_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL DEFAULT 100,
  current_value INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on group_goals
ALTER TABLE public.group_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for group_goals
CREATE POLICY "Group members can view goals"
  ON public.group_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_goals.group_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

CREATE POLICY "Group admins can create goals"
  ON public.group_goals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_goals.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  );

CREATE POLICY "Group admins can update goals"
  ON public.group_goals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_goals.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  );

CREATE POLICY "Members can update progress"
  ON public.group_goals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_goals.group_id
      AND user_id = auth.uid()
      AND status = 'approved'
    )
  );

CREATE POLICY "Group admins can delete goals"
  ON public.group_goals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_goals.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
      AND status = 'approved'
    )
  );

-- Create session feedback table
CREATE TABLE public.session_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS on session_feedback
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_feedback
CREATE POLICY "Group members can view feedback"
  ON public.session_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions ss
      WHERE ss.id = session_feedback.session_id
      AND is_group_member(auth.uid(), ss.group_id)
    )
  );

CREATE POLICY "Attendees can create feedback"
  ON public.session_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.session_attendance sa
      WHERE sa.session_id = session_feedback.session_id
      AND sa.user_id = auth.uid()
      AND sa.attended = TRUE
    )
  );

CREATE POLICY "Users can update their own feedback"
  ON public.session_feedback
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.session_feedback
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update group_members role column to support moderator
ALTER TABLE public.group_members 
  DROP CONSTRAINT IF EXISTS group_members_role_check;

ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_role_check 
  CHECK (role IN ('admin', 'moderator', 'member'));

-- Function to check if user is admin or moderator
CREATE OR REPLACE FUNCTION is_group_moderator(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id 
    AND group_id = _group_id
    AND role IN ('admin', 'moderator')
    AND status = 'approved'
  );
$$;

-- Update study_sessions policies to allow moderators to manage sessions
DROP POLICY IF EXISTS "Group admins can create sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Group admins can update sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Group admins can delete sessions" ON public.study_sessions;

CREATE POLICY "Admins and moderators can create sessions"
  ON public.study_sessions
  FOR INSERT
  WITH CHECK (is_group_moderator(auth.uid(), group_id));

CREATE POLICY "Admins and moderators can update sessions"
  ON public.study_sessions
  FOR UPDATE
  USING (is_group_moderator(auth.uid(), group_id));

CREATE POLICY "Admins and moderators can delete sessions"
  ON public.study_sessions
  FOR DELETE
  USING (is_group_moderator(auth.uid(), group_id));

-- Trigger for group_goals updated_at
CREATE TRIGGER update_group_goals_updated_at
  BEFORE UPDATE ON public.group_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for session_feedback updated_at
CREATE TRIGGER update_session_feedback_updated_at
  BEFORE UPDATE ON public.session_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_group_goals_group_id ON public.group_goals(group_id);
CREATE INDEX idx_session_feedback_session_id ON public.session_feedback(session_id);
CREATE INDEX idx_session_feedback_user_id ON public.session_feedback(user_id);