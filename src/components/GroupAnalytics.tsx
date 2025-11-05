import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, Calendar, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";

interface AnalyticsData {
  totalSessions: number;
  averageAttendance: number;
  mostActiveMembers: { name: string; count: number }[];
  sessionFrequency: { date: string; count: number }[];
  memberGrowth: { date: string; count: number }[];
}

export function GroupAnalytics({ groupId }: { groupId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSessions: 0,
    averageAttendance: 0,
    mostActiveMembers: [],
    sessionFrequency: [],
    memberGrowth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [groupId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch total sessions
      const { count: sessionsCount } = await supabase
        .from('study_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      // Fetch attendance data
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select(`
          id,
          scheduled_at,
          session_attendance (
            attended,
            user_id
          )
        `)
        .eq('group_id', groupId)
        .order('scheduled_at', { ascending: false });

      // Calculate average attendance
      let totalAttended = 0;
      let totalSlots = 0;
      const sessionFrequencyMap: { [key: string]: number } = {};

      sessionsData?.forEach((session) => {
        const attended = session.session_attendance?.filter((a: any) => a.attended).length || 0;
        const total = session.session_attendance?.length || 0;
        totalAttended += attended;
        totalSlots += total;

        // Session frequency
        const date = format(new Date(session.scheduled_at), 'MMM dd');
        sessionFrequencyMap[date] = (sessionFrequencyMap[date] || 0) + 1;
      });

      const averageAttendance = totalSlots > 0 ? (totalAttended / totalSlots) * 100 : 0;

      // Fetch most active members
      const { data: attendanceData } = await supabase
        .from('session_attendance')
        .select(`
          user_id,
          attended,
          profiles (
            full_name
          )
        `)
        .eq('attended', true)
        .in('session_id', sessionsData?.map(s => s.id) || []);

      const memberActivityMap: { [key: string]: { name: string; count: number } } = {};
      attendanceData?.forEach((record: any) => {
        const userId = record.user_id;
        const name = record.profiles?.full_name || 'Unknown';
        if (!memberActivityMap[userId]) {
          memberActivityMap[userId] = { name, count: 0 };
        }
        memberActivityMap[userId].count += 1;
      });

      const mostActiveMembers = Object.values(memberActivityMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Fetch member growth
      const { data: membersData } = await supabase
        .from('group_members')
        .select('joined_at')
        .eq('group_id', groupId)
        .eq('status', 'approved')
        .order('joined_at', { ascending: true });

      const memberGrowthMap: { [key: string]: number } = {};
      membersData?.forEach((member) => {
        const date = format(new Date(member.joined_at), 'MMM dd');
        memberGrowthMap[date] = (memberGrowthMap[date] || 0) + 1;
      });

      // Convert to cumulative
      let cumulative = 0;
      const memberGrowth = Object.entries(memberGrowthMap).map(([date, count]) => {
        cumulative += count;
        return { date, count: cumulative };
      });

      const sessionFrequency = Object.entries(sessionFrequencyMap).map(([date, count]) => ({
        date,
        count,
      }));

      setAnalytics({
        totalSessions: sessionsCount || 0,
        averageAttendance,
        mostActiveMembers,
        sessionFrequency,
        memberGrowth,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">All-time sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageAttendance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.mostActiveMembers.length}</div>
            <p className="text-xs text-muted-foreground">Top contributors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Growth</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.memberGrowth[analytics.memberGrowth.length - 1]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.mostActiveMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No attendance data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.mostActiveMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {member.count} sessions
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.sessionFrequency.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sessions scheduled yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.sessionFrequency.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.date}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{ width: `${(item.count / Math.max(...analytics.sessionFrequency.map(s => s.count))) * 100}px` }}
                      />
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}