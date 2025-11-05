-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'new_group',
  'join_request_approved',
  'join_request_rejected',
  'session_reminder',
  'badge_earned',
  'new_message'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create study sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on study_sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_sessions
CREATE POLICY "Group members can view sessions"
  ON public.study_sessions
  FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Group admins can create sessions"
  ON public.study_sessions
  FOR INSERT
  WITH CHECK (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins can update sessions"
  ON public.study_sessions
  FOR UPDATE
  USING (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Group admins can delete sessions"
  ON public.study_sessions
  FOR DELETE
  USING (is_group_admin(auth.uid(), group_id));

-- Create session attendance table
CREATE TABLE public.session_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  rsvp_status TEXT DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS on session_attendance
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_attendance
CREATE POLICY "Group members can view attendance"
  ON public.session_attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sessions ss
      WHERE ss.id = session_id
      AND is_group_member(auth.uid(), ss.group_id)
    )
  );

CREATE POLICY "Users can manage their own attendance"
  ON public.session_attendance
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for study_sessions updated_at
CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create index for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_study_sessions_group_id ON public.study_sessions(group_id);
CREATE INDEX idx_session_attendance_session_id ON public.session_attendance(session_id);
CREATE INDEX idx_session_attendance_user_id ON public.session_attendance(user_id);