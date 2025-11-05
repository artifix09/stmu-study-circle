import { supabase } from "@/integrations/supabase/client";

export const useGroupJoinNotifications = () => {
  const createJoinRequestNotification = async ({
    adminId,
    userName,
    groupName,
  }: {
    adminId: string;
    userName: string;
    groupName: string;
  }) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: adminId,
      type: "new_group" as const,
      title: "New Join Request",
      message: `${userName} wants to join ${groupName}`,
      metadata: { userName, groupName },
    });

    if (error) {
      console.error("Error creating join request notification:", error);
    }
  };

  const createApprovalNotification = async ({
    userId,
    groupName,
    approved,
  }: {
    userId: string;
    groupName: string;
    approved: boolean;
  }) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type: approved ? ("join_request_approved" as const) : ("join_request_rejected" as const),
      title: approved ? "Join Request Approved" : "Join Request Rejected",
      message: approved
        ? `Your request to join ${groupName} has been approved!`
        : `Your request to join ${groupName} was not approved.`,
      metadata: { groupName },
    });

    if (error) {
      console.error("Error creating approval notification:", error);
    }
  };

  const createMemberJoinedNotification = async ({
    groupId,
    userName,
    groupName,
  }: {
    groupId: string;
    userName: string;
    groupName: string;
  }) => {
    // Get all group members to notify them
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .eq("status", "approved");

    if (members && members.length > 0) {
      // Insert notifications one by one to avoid type issues
      for (const member of members) {
        await supabase.from("notifications").insert({
          user_id: member.user_id,
          type: "new_message" as const,
          title: "New Member Joined",
          message: `${userName} joined ${groupName}`,
          metadata: { userName, groupName },
        });
      }
    }
  };

  return {
    createJoinRequestNotification,
    createApprovalNotification,
    createMemberJoinedNotification,
  };
};
