import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardData = (userId: string | undefined) => {
  const [myGroupsCount, setMyGroupsCount] = useState(0);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0);
  const [availableGroupsCount, setAvailableGroupsCount] = useState(0);
  const [attendanceData, setAttendanceData] = useState<{ month: string; sessions: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchDashboardData = async () => {
      setLoading(true);

      // Fetch my groups count
      const { data: myGroups } = await supabase
        .from("group_members")
        .select("id, group_id")
        .eq("user_id", userId)
        .eq("status", "approved");
      setMyGroupsCount(myGroups?.length || 0);

      // Fetch upcoming sessions count
      const now = new Date().toISOString();
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("id, group_id")
        .gte("scheduled_at", now);

      if (sessions && myGroups) {
        const groupIds = myGroups.map(g => g.group_id);
        const upcomingSessions = sessions.filter(s => groupIds.includes(s.group_id));
        setUpcomingSessionsCount(upcomingSessions.length);
      }

      // Fetch available public groups count
      const { data: publicGroups } = await supabase
        .from("study_groups")
        .select("id", { count: "exact" })
        .eq("visibility", "public");
      setAvailableGroupsCount(publicGroups?.length || 0);

      // Fetch attendance data for chart (last 6 months)
      const { data: attendance } = await supabase
        .from("session_attendance")
        .select("joined_at, attended")
        .eq("user_id", userId)
        .eq("attended", true)
        .order("joined_at", { ascending: false })
        .limit(100);

      if (attendance) {
        const monthlyData: { [key: string]: number } = {};
        attendance.forEach(a => {
          const month = new Date(a.joined_at).toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const chartData = Object.entries(monthlyData)
          .slice(0, 6)
          .reverse()
          .map(([month, sessions]) => ({ month, sessions }));
        
        setAttendanceData(chartData);
      }

      setLoading(false);
    };

    fetchDashboardData();

    // Set up real-time subscription for updates
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_sessions'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { 
    myGroupsCount, 
    upcomingSessionsCount, 
    availableGroupsCount, 
    attendanceData,
    loading 
  };
};
