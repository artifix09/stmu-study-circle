import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useNotificationSystem = () => {
  const { toast } = useToast();

  const createNewGroupNotification = async ({
    groupId,
    groupName,
    creatorId,
  }: {
    groupId: string;
    groupName: string;
    creatorId: string;
  }) => {
    try {
      // Notify all users about the new public group
      const { data: users } = await supabase
        .from("profiles")
        .select("id")
        .neq("id", creatorId);

      if (users && users.length > 0) {
        // Create notifications in batches
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          
          const notifications = batch.map(user => ({
            user_id: user.id,
            type: "new_group" as const,
            title: "New Study Group Available",
            message: `${groupName} is now available to join`,
            metadata: { groupId, groupName },
          }));

          await supabase.from("notifications").insert(notifications);
        }
      }
    } catch (error) {
      console.error("Error creating group notifications:", error);
    }
  };

  const createBadgeEarnedNotification = async ({
    userId,
    badgeName,
    badgeDescription,
  }: {
    userId: string;
    badgeName: string;
    badgeDescription: string;
  }) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "badge_earned" as const,
        title: "🏆 Badge Earned!",
        message: `You've earned the ${badgeName} badge! ${badgeDescription}`,
        metadata: { badgeName },
      });

      if (error) {
        console.error("Error creating badge notification:", error);
      } else {
        toast({
          title: "🏆 Badge Earned!",
          description: `You've earned the ${badgeName} badge!`,
        });
      }
    } catch (error) {
      console.error("Error creating badge notification:", error);
    }
  };

  return {
    createNewGroupNotification,
    createBadgeEarnedNotification,
  };
};
