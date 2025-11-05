-- Insert default badges with proper UUIDs
INSERT INTO public.badges (name, description, icon) VALUES
  ('Founder', 'Created a study group', '🏗️'),
  ('Scholar', 'Attended 5 study sessions', '📚'),
  ('Dedicated Learner', 'Attended 10 study sessions', '🎓'),
  ('Consistent Contributor', 'Participated in a group for 30 days', '⭐')
ON CONFLICT DO NOTHING;

-- Function to get badge ID by name
CREATE OR REPLACE FUNCTION get_badge_id(badge_name TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.badges WHERE name = badge_name LIMIT 1;
$$;

-- Function to award Founder badge when user creates a group
CREATE OR REPLACE FUNCTION award_founder_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award Founder badge if user doesn't have it
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (NEW.creator_id, get_badge_id('Founder'))
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger for Founder badge
DROP TRIGGER IF EXISTS award_founder_badge_trigger ON public.study_groups;
CREATE TRIGGER award_founder_badge_trigger
  AFTER INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION award_founder_badge();

-- Function to check and award attendance badges
CREATE OR REPLACE FUNCTION check_attendance_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attendance_count INTEGER;
BEGIN
  -- Only process if marking as attended
  IF NEW.attended = TRUE THEN
    -- Count total attended sessions for this user
    SELECT COUNT(*)
    INTO attendance_count
    FROM public.session_attendance
    WHERE user_id = NEW.user_id
      AND attended = TRUE;
    
    -- Award Scholar badge (5 sessions)
    IF attendance_count >= 5 THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, get_badge_id('Scholar'))
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Award Dedicated Learner badge (10 sessions)
    IF attendance_count >= 10 THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, get_badge_id('Dedicated Learner'))
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for attendance badges
DROP TRIGGER IF EXISTS check_attendance_badges_trigger ON public.session_attendance;
CREATE TRIGGER check_attendance_badges_trigger
  AFTER INSERT OR UPDATE ON public.session_attendance
  FOR EACH ROW
  EXECUTE FUNCTION check_attendance_badges();

-- Function to check Consistent Contributor badge (30 days in a group)
CREATE OR REPLACE FUNCTION check_consistent_contributor()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record RECORD;
  badge_id_val UUID;
BEGIN
  SELECT get_badge_id('Consistent Contributor') INTO badge_id_val;
  
  -- Find members who have been in a group for 30+ days
  FOR member_record IN
    SELECT user_id
    FROM public.group_members
    WHERE status = 'approved'
      AND joined_at <= NOW() - INTERVAL '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_badges
        WHERE user_id = group_members.user_id
          AND badge_id = badge_id_val
      )
  LOOP
    -- Award Consistent Contributor badge
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (member_record.user_id, badge_id_val)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;