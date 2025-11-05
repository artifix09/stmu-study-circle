import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGroupJoinNotifications } from "@/hooks/use-group-join-notifications";

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  profiles: {
    full_name: string;
    department: string | null;
  };
}

interface GroupMembersDialogProps {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
}

export const GroupMembersDialog = ({ groupId, groupName, isAdmin }: GroupMembersDialogProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { createApprovalNotification } = useGroupJoinNotifications();

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, groupId]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        *,
        profiles:user_id (
          full_name,
          department
        )
      `)
      .eq("group_id", groupId)
      .order("joined_at", { ascending: false });

    if (!error && data) {
      setMembers(data as Member[]);
    }
  };

  const handleApprove = async (memberId: string, userId: string) => {
    const { error } = await supabase
      .from("group_members")
      .update({ status: "approved" })
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve member",
        variant: "destructive",
      });
    } else {
      await createApprovalNotification({
        userId,
        groupName,
        approved: true,
      });
      toast({
        title: "Success",
        description: "Member approved successfully",
      });
      fetchMembers();
    }
  };

  const handleReject = async (memberId: string, userId: string) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject member",
        variant: "destructive",
      });
    } else {
      await createApprovalNotification({
        userId,
        groupName,
        approved: false,
      });
      toast({
        title: "Success",
        description: "Member rejected",
      });
      fetchMembers();
    }
  };

  const handleRemove = async (memberId: string) => {
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
        title: "Success",
        description: "Member removed successfully",
      });
      fetchMembers();
    }
  };

  const approvedMembers = members.filter(m => m.status === "approved");
  const pendingMembers = members.filter(m => m.status === "pending");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="w-4 h-4 mr-2" />
          Members ({approvedMembers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Approved Members */}
          <div>
            <h3 className="font-semibold mb-3">Members ({approvedMembers.length})</h3>
            <div className="space-y-2">
              {approvedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.profiles.department || "No department"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                    {isAdmin && member.role !== "admin" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(member.id)}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          {isAdmin && pendingMembers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Pending Requests ({pendingMembers.length})</h3>
              <div className="space-y-2">
                {pendingMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.profiles.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles.department || "No department"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(member.id, member.user_id)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(member.id, member.user_id)}
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
