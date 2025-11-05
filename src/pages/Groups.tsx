import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Search, Users, ArrowLeft, LogOut, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GroupRecommendations from "@/components/GroupRecommendations";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import { NotificationCenter } from "@/components/NotificationCenter";

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  course_name: string | null;
  course_code: string | null;
  department: string | null;
  subject: string | null;
  study_topics: string[] | null;
  meeting_days: string[] | null;
  meeting_time: string | null;
  meeting_location: string | null;
  visibility: string;
  max_members: number | null;
  memberCount: number;
}

const Groups = () => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    // Fetch all groups (both public and private) so users can see and request to join
    const { data, error } = await supabase
      .from("study_groups")
      .select("*, group_members(count)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const groupsWithCounts = data.map(group => ({
        ...group,
        memberCount: Array.isArray(group.group_members) 
          ? group.group_members[0]?.count || 0 
          : 0,
      }));
      setGroups(groupsWithCounts);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">StudyHub</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <CreateGroupDialog userId={user.id} onGroupCreated={fetchGroups} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Groups</h1>
          <p className="text-muted-foreground">
            Find and join study groups that match your interests
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search groups by name, subject, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Groups List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {searchQuery ? "Search Results" : "All Groups"}
              </h2>
              {filteredGroups.length > 0 ? (
                <div className="grid gap-4">
                  {filteredGroups.map((group) => (
                    <Card key={group.id} className="hover:border-primary transition-colors cursor-pointer"
                      onClick={() => navigate(`/groups/${group.id}`)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="mb-2">{group.name}</CardTitle>
                            {group.course_code && (
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                {group.course_code} - {group.course_name}
                              </p>
                            )}
                            <CardDescription className="line-clamp-2">
                              {group.description || "No description"}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1 ml-4">
                            <Badge variant="outline" className="gap-1">
                              <Users className="w-3 h-3" />
                              {group.memberCount}/{group.max_members || "∞"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {group.study_topics && group.study_topics.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Topics:</p>
                              <div className="flex flex-wrap gap-1">
                                {group.study_topics.slice(0, 3).map((topic, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                                {group.study_topics.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{group.study_topics.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {group.meeting_days && group.meeting_days.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Meets:</span> {group.meeting_days.join(', ')}
                              {group.meeting_time && ` at ${group.meeting_time}`}
                            </div>
                          )}
                          {group.meeting_location && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Location:</span> {group.meeting_location}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 pt-2">
                            {group.department && (
                              <Badge variant="outline">{group.department}</Badge>
                            )}
                            {group.subject && (
                              <Badge variant="outline">{group.subject}</Badge>
                            )}
                            <Badge variant={group.visibility === "public" ? "default" : "secondary"}>
                              {group.visibility}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No groups found matching your search" : "No groups available yet"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <GroupRecommendations userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Groups;
