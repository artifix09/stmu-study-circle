import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserCog, Users as UsersIcon } from "lucide-react";
import { useGroupJoinNotifications } from "@/hooks/use-group-join-notifications";
import { RolePermissionsGuide } from "@/components/RolePermissionsGuide";

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profiles: {
    full_name: string;
    department: string | null;
  };
}

export function RoleManagement({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState<string>("");
  const { toast } = useToast();
  const { createApprovalNotification, createMemberJoinedNotification } = useGroupJoinNotifications();

  useEffect(() => {
    fetchMembers();
    fetchGroupName();
  }, [groupId]);

  const fetchGroupName = async () => {
    const { data } = await supabase
      .from("study_groups")
      .select("name")
      .eq("id", groupId)
      .single();
    
    if (data) {
      setGroupName(data.name);
    }
  };

  const fetchMembers = async () => {
    const { data: approvedMembers } = await supabase
      .from("group_members")
      .select("*, profiles(full_name, department)")
      .eq("group_id", groupId)
      .eq("status", "approved")
      .order("role", { ascending: true });

    const { data: pending } = await supabase
      .from("group_members")
      .select("*, profiles(full_name, department)")
      .eq("group_id", groupId)
      .eq("status", "pending")
      .order("joined_at", { ascending: false });

    setMembers(approvedMembers || []);
    setPendingRequests(pending || []);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("group_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Member role updated",
      });
      fetchMembers();
    }
  };

  const handleJoinRequest = async (memberId: string, approve: boolean) => {
    // Get member details before updating
    const member = pendingRequests.find((m) => m.id === memberId);
    
    const { error } = await supabase
      .from("group_members")
      .update({ status: approve ? "approved" : "rejected" })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to process request",
        variant: "destructive",
      });
    } else {
      // Send notification to the user
      if (member) {
        await createApprovalNotification({
          userId: member.user_id,
          groupName: groupName,
          approved: approve,
        });

        // If approved, notify all group members
        if (approve) {
          await createMemberJoinedNotification({
            groupId: groupId,
            userName: member.profiles.full_name,
            groupName: groupName,
          });
        }
      }

      toast({
        title: "Success!",
        description: approve ? "Member approved and notified" : "Request rejected",
      });
      fetchMembers();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed",
        description: "Member removed from group",
      });
      fetchMembers();
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case "admin":
        return "default";
      case "moderator":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "moderator":
        return <UserCog className="w-4 h-4" />;
      default:
        return <UsersIcon className="w-4 h-4" />;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <RolePermissionsGuide />
      
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Join Requests</CardTitle>
            <CardDescription>{pendingRequests.length} waiting for approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{member.profiles.full_name}</p>
                    {member.profiles.department && (
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.department}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleJoinRequest(member.id, true)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleJoinRequest(member.id, false)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Member Roles</CardTitle>
          <CardDescription>Manage member permissions and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.profiles.full_name}</p>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                    </div>
                    {member.profiles.department && (
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.department}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  {member.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}