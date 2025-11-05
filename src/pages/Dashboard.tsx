import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, LogOut, User as UserIcon, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { NotificationCenter } from "@/components/NotificationCenter";
import { DashboardStats } from "@/components/DashboardStats";
import { GroupStatsCard } from "@/components/GroupStatsCard";
import GroupRecommendations from "@/components/GroupRecommendations";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 hover:shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STMU STUDY CIRCLE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="hover:scale-105 transition-transform">
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:scale-105 transition-transform">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Welcome back, {user.user_metadata?.full_name || "Student"}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Ready to collaborate and achieve academic excellence together?
          </p>
        </div>

        <DashboardStats userId={user.id} />

        <div className="mb-8">
          <GroupStatsCard />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
            </div>

            <div className="grid gap-4">
              <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer" onClick={() => navigate("/groups")}>
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">Browse Groups</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover and join study groups
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Explore →
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 hover:border-secondary transition-colors cursor-pointer" onClick={() => navigate("/sessions")}>
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-7 h-7 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">Session Calendar</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage study sessions
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <GroupRecommendations userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
