import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Globe, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const GroupStatsCard = () => {
  const [stats, setStats] = useState({
    totalPublic: 0,
    totalPrivate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupStats();
  }, []);

  const fetchGroupStats = async () => {
    try {
      // Fetch public groups count
      const { count: publicCount } = await supabase
        .from("study_groups")
        .select("*", { count: "exact", head: true })
        .eq("visibility", "public");

      // Fetch private groups count
      const { count: privateCount } = await supabase
        .from("study_groups")
        .select("*", { count: "exact", head: true })
        .eq("visibility", "private");

      setStats({
        totalPublic: publicCount || 0,
        totalPrivate: privateCount || 0,
      });
    } catch (error) {
      console.error("Error fetching group stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalGroups = stats.totalPublic + stats.totalPrivate;

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          Platform Groups
        </CardTitle>
        <CardDescription>All available study groups</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {totalGroups}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Groups</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{stats.totalPublic}</p>
              <p className="text-xs text-muted-foreground">Public</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{stats.totalPrivate}</p>
              <p className="text-xs text-muted-foreground">Private</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
