import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, BookOpen, TrendingUp } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  userId: string;
}

export const DashboardStats = ({ userId }: DashboardStatsProps) => {
  const { myGroupsCount, upcomingSessionsCount, availableGroupsCount, attendanceData, loading } = useDashboardData(userId);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-primary" />
              </div>
              My Groups
            </CardTitle>
            <CardDescription>Study groups you're part of</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-primary">{myGroupsCount}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-secondary" />
              </div>
              Upcoming Sessions
            </CardTitle>
            <CardDescription>Study sessions this week</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-secondary">{upcomingSessionsCount}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              Available Groups
            </CardTitle>
            <CardDescription>Groups to explore</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-accent">{availableGroupsCount}</p>
          </CardContent>
        </Card>
      </div>

      {attendanceData.length > 0 && (
        <Card className="mb-8 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Your Activity
            </CardTitle>
            <CardDescription>Session attendance over the last months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
};
