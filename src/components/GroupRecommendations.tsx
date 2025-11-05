import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  department: string | null;
  semester: number | null;
  interests: string[] | null;
}

interface RecommendedGroup {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  subject: string | null;
  memberCount: number;
  matchReason: string;
  matchScore: number;
}

interface GroupRecommendationsProps {
  userId: string;
}

const GroupRecommendations = ({ userId }: GroupRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<RecommendedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("department, semester, interests")
        .eq("id", userId)
        .single();

      if (!profile) return;

      // Fetch user's current groups
      const { data: userGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId)
        .eq("status", "approved");

      const userGroupIds = userGroups?.map(g => g.group_id) || [];

      // Fetch all public groups with member counts
      const { data: groups } = await supabase
        .from("study_groups")
        .select("*, group_members(count)")
        .eq("visibility", "public")
        .not("id", "in", `(${userGroupIds.length > 0 ? userGroupIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

      if (!groups) return;

      // Calculate match scores
      const scoredGroups = await Promise.all(
        groups.map(async (group) => {
          let score = 0;
          const reasons: string[] = [];

          // Department match (highest priority)
          if (profile.department && group.department === profile.department) {
            score += 50;
            reasons.push(`Same department: ${profile.department}`);
          }

          // Subject/interest match
          if (profile.interests && group.subject) {
            const hasMatchingInterest = profile.interests.some(
              interest => group.subject?.toLowerCase().includes(interest.toLowerCase())
            );
            if (hasMatchingInterest) {
              score += 30;
              reasons.push(`Matches your interests`);
            }
          }

          // Check for mutual members
          const { data: groupMembers } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", group.id)
            .eq("status", "approved");

          if (groupMembers && userGroups) {
            const mutualCount = groupMembers.filter(gm =>
              userGroups.some(ug => {
                // Check if this user is in any of my other groups
                return supabase
                  .from("group_members")
                  .select("user_id")
                  .eq("group_id", ug.group_id)
                  .eq("user_id", gm.user_id)
                  .eq("status", "approved")
                  .then(({ data }) => data && data.length > 0);
              })
            ).length;

            if (mutualCount > 0) {
              score += 20;
              reasons.push(`${mutualCount} mutual member${mutualCount > 1 ? 's' : ''}`);
            }
          }

          // Active group bonus
          const memberCount = Array.isArray(group.group_members) 
            ? group.group_members[0]?.count || 0 
            : 0;
          if (memberCount > 5) {
            score += 10;
            reasons.push("Active group");
          }

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            department: group.department,
            subject: group.subject,
            memberCount,
            matchReason: reasons.join(" • "),
            matchScore: score,
          };
        })
      );

      // Sort by score and take top 5
      const topRecommendations = scoredGroups
        .filter(g => g.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      setRecommendations(topRecommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading recommendations...</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No recommendations yet. Complete your profile to get personalized group suggestions!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Recommended for You
        </CardTitle>
        <CardDescription>Groups that match your profile and interests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((group) => (
            <div key={group.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  View
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {group.department && <Badge variant="secondary">{group.department}</Badge>}
                {group.subject && <Badge variant="outline">{group.subject}</Badge>}
                <Badge variant="outline" className="gap-1">
                  <Users className="w-3 h-3" />
                  {group.memberCount}
                </Badge>
              </div>
              {group.matchReason && (
                <p className="text-xs text-accent font-medium">
                  ✨ {group.matchReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupRecommendations;
