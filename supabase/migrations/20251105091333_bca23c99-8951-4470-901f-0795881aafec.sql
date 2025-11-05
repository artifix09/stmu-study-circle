-- Add max_members field to study_groups
ALTER TABLE public.study_groups 
ADD COLUMN max_members integer DEFAULT NULL;

COMMENT ON COLUMN public.study_groups.max_members IS 'Maximum number of members allowed in the group (NULL = unlimited)';

-- Create function to check if group is full
CREATE OR REPLACE FUNCTION public.is_group_full(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_members integer;
  v_current_count integer;
BEGIN
  -- Get max members for the group
  SELECT max_members INTO v_max_members
  FROM public.study_groups
  WHERE id = p_group_id;
  
  -- If no limit, return false
  IF v_max_members IS NULL THEN
    RETURN false;
  END IF;
  
  -- Count approved members
  SELECT COUNT(*) INTO v_current_count
  FROM public.group_members
  WHERE group_id = p_group_id
  AND status = 'approved';
  
  -- Return true if at or over capacity
  RETURN v_current_count >= v_max_members;
END;
$$;

-- Create trigger function to prevent joining full groups
CREATE OR REPLACE FUNCTION public.check_group_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check when inserting or updating to approved status
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
    
    IF public.is_group_full(NEW.group_id) THEN
      RAISE EXCEPTION 'Group is full. Maximum capacity reached.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce capacity
DROP TRIGGER IF EXISTS enforce_group_capacity ON public.group_members;
CREATE TRIGGER enforce_group_capacity
  BEFORE INSERT OR UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_group_capacity();