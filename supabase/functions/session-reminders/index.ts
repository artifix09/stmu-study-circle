import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  group_id: string;
}

interface Member {
  user_id: string;
}

interface NotificationInsert {
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for upcoming sessions...");

    // Get sessions happening in the next 24-25 hours (to catch ones we might have missed)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: sessions, error: sessionsError } = await supabase
      .from("study_sessions")
      .select("id, title, scheduled_at, group_id")
      .gte("scheduled_at", tomorrow.toISOString())
      .lt("scheduled_at", dayAfter.toISOString())
      .returns<Session[]>();

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch sessions" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${sessions?.length || 0} sessions to notify about`);

    let notificationCount = 0;

    // For each session, notify all group members
    for (const session of sessions || []) {
      // Get all approved members of the group
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", session.group_id)
        .eq("status", "approved")
        .returns<Member[]>();

      if (membersError) {
        console.error(`Error fetching members for group ${session.group_id}:`, membersError);
        continue;
      }

      // Create notifications for each member
      const notifications: NotificationInsert[] = (members || []).map((member) => ({
        user_id: member.user_id,
        type: "session_reminder",
        title: "Upcoming Study Session",
        message: `"${session.title}" starts in 24 hours`,
        metadata: {
          session_id: session.id,
          scheduled_at: session.scheduled_at,
        },
      }));

      const { error: notifyError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifyError) {
        console.error(`Error creating notifications for session ${session.id}:`, notifyError);
      } else {
        notificationCount += notifications.length;
        console.log(`Created ${notifications.length} notifications for session ${session.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sessions_checked: sessions?.length || 0,
        notifications_created: notificationCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in session-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});