-- Create study_groups table
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  subject TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create group_messages table
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id 
    AND group_id = _group_id
    AND status = 'approved'
  );
$$;

-- Security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id 
    AND group_id = _group_id
    AND role = 'admin'
    AND status = 'approved'
  );
$$;

-- RLS Policies for study_groups
CREATE POLICY "Anyone can view public groups"
  ON public.study_groups
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR 
    creator_id = auth.uid() OR 
    public.is_group_member(auth.uid(), id)
  );

CREATE POLICY "Users can create groups"
  ON public.study_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their groups"
  ON public.study_groups
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their groups"
  ON public.study_groups
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- RLS Policies for group_members
CREATE POLICY "Members can view group memberships"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update memberships"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Users can leave groups or admins can remove"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_group_admin(auth.uid(), group_id)
  );

-- RLS Policies for group_messages
CREATE POLICY "Members can view group messages"
  ON public.group_messages
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can send messages"
  ON public.group_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_group_member(auth.uid(), group_id)
  );

-- Enable realtime for messages
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Function to auto-add creator as admin
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.creator_id, 'admin', 'approved');
  RETURN NEW;
END;
$$;

-- Trigger to add creator as admin
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();

-- Trigger for groups updated_at
CREATE TRIGGER on_group_updated
  BEFORE UPDATE ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();