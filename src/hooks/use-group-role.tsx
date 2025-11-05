import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type GroupRole = "admin" | "moderator" | "member" | null;

interface GroupRoleResult {
  role: GroupRole;
  isMember: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  canManageMembers: boolean; // admin only
  canScheduleSessions: boolean; // admin or moderator
  canModerate: boolean; // admin or moderator
  canParticipate: boolean; // any approved member
  loading: boolean;
}

export function useGroupRole(groupId: string | undefined, user: User | null): GroupRoleResult {
  const [role, setRole] = useState<GroupRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("group_members")
        .select("role, status")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      setRole(data?.role as GroupRole || null);
      setLoading(false);
    };

    fetchRole();

    // Subscribe to role changes
    const channel = supabase
      .channel(`group-role-${groupId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId},user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setRole(null);
          } else if (payload.new) {
            const newData = payload.new as { role: string; status: string };
            setRole(newData.status === 'approved' ? newData.role as GroupRole : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  const isMember = role !== null;
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const canManageMembers = isAdmin;
  const canScheduleSessions = isAdmin || isModerator;
  const canModerate = isAdmin || isModerator;
  const canParticipate = isMember;

  return {
    role,
    isMember,
    isAdmin,
    isModerator,
    canManageMembers,
    canScheduleSessions,
    canModerate,
    canParticipate,
    loading,
  };
}
