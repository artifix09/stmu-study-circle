import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Send, ArrowLeft, Users as UsersIcon, BarChart, Target, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { GroupAnalytics } from "@/components/GroupAnalytics";
import { GroupGoals } from "@/components/GroupGoals";
import { RoleManagement } from "@/components/RoleManagement";
import { SessionSchedulingDialog } from "@/components/SessionSchedulingDialog";
import { useGroupJoinNotifications } from "@/hooks/use-group-join-notifications";
import { GroupMembersDialog } from "@/components/GroupMembersDialog";
import { EditGroupDialog } from "@/components/EditGroupDialog";
import { useGroupRole } from "@/hooks/use-group-role";
import { NotificationCenter } from "@/components/NotificationCenter";

interface GroupInfo {
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
  creator_id: string;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
  user_id: string;
}

interface Member {
  user_id: string;
  role: string;
  status: string;
  profiles: {
    full_name: string;
    department: string | null;
  };
}

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { createJoinRequestNotification, createMemberJoinedNotification } = useGroupJoinNotifications();
  
  // Use the role hook
  const { 
    role, 
    isMember, 
    isAdmin, 
    isModerator,
    canScheduleSessions,
    canManageMembers 
  } = useGroupRole(groupId, user);

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
    if (groupId && user) {
      fetchGroup();
      fetchMessages();
      fetchMembers();
      const messageUnsubscribe = subscribeToMessages();
      const presenceUnsubscribe = trackPresence();
      
      return () => {
        if (messageUnsubscribe) messageUnsubscribe();
        if (presenceUnsubscribe) presenceUnsubscribe();
      };
    }
  }, [groupId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load group",
        variant: "destructive",
      });
    } else {
      setGroup(data);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("group_messages")
      .select("*, profiles(full_name)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select("*, profiles(full_name, department)")
      .eq("group_id", groupId)
      .eq("status", "approved");

    if (!error && data) {
      setMembers(data);
    }
  };

  // Removed checkMembership - now handled by useGroupRole hook

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('group-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg = {
            ...payload.new,
            profiles: { full_name: profile?.full_name || "Unknown" }
          } as Message;

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const trackPresence = () => {
    if (!user || !groupId) return;

    const channel = supabase.channel(`group:${groupId}:presence`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.keys(state);
        setOnlineUsers(new Set(userIds));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          updated.delete(key);
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from("group_messages")
      .insert({
        group_id: groupId,
        user_id: user.id,
        message: newMessage.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
  };

  const handleJoinGroup = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        status: group?.visibility === "public" ? "approved" : "pending",
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already joined",
          description: "You are already a member of this group",
          variant: "destructive",
        });
      } else if (error.message?.includes("full")) {
        toast({
          title: "Group is full",
          description: "This group has reached its maximum capacity",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to join group",
          variant: "destructive",
        });
      }
    } else {
      // If private group, notify admin about join request
      if (group?.visibility === "private" && group.creator_id) {
        const { data: userData } = await supabase.auth.getUser();
        const userName = userData?.user?.user_metadata?.full_name || "A user";
        
        await createJoinRequestNotification({
          adminId: group.creator_id,
          userName: userName,
          groupName: group.name,
        });
      }

      // If public group, notify all members
      if (group?.visibility === "public" && groupId) {
        const { data: userData } = await supabase.auth.getUser();
        const userName = userData?.user?.user_metadata?.full_name || "A user";
        
        await createMemberJoinedNotification({
          groupId: groupId,
          userName: userName,
          groupName: group.name,
        });
      }

      toast({
        title: "Success!",
        description: group?.visibility === "public" 
          ? "You have joined the group" 
          : "Join request sent. Admin will be notified.",
      });
      
      if (group?.visibility === "public") {
        fetchMembers();
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !groupId) return;

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "You have left the group",
      });
      navigate("/groups");
    }
  };

  if (!user || !group) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/groups")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold">{group.name}</h1>
                <p className="text-xs text-muted-foreground">{members.length} members</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            {isMember && (
              <>
                <Button variant="outline" size="sm" onClick={handleLeaveGroup}>
                  Leave Group
                </Button>
                <GroupMembersDialog 
                  groupId={groupId!} 
                  groupName={group.name}
                  isAdmin={isAdmin}
                />
              </>
            )}
            {isAdmin && (
              <EditGroupDialog 
                groupId={groupId!}
                onGroupUpdated={fetchGroup}
              />
            )}
            {canScheduleSessions && (
              <SessionSchedulingDialog 
                groupId={groupId!} 
                onSessionCreated={() => {}} 
                userRole={role}
              />
            )}
            <Badge variant={group.visibility === "public" ? "secondary" : "outline"}>
              {group.visibility}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content Area */}
          <div className="space-y-4">
            {isMember ? (
              <Tabs defaultValue="chat" className="w-full">
                <TabsList className={`grid w-full ${canManageMembers ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="goals">
                    <Target className="w-4 h-4 mr-2" />
                    Goals
                  </TabsTrigger>
                  <TabsTrigger value="analytics">
                    <BarChart className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  {canManageMembers && (
                    <TabsTrigger value="manage">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </TabsTrigger>
                  )}
                </TabsList>
                <TabsContent value="chat">
                  <Card>
                    <CardHeader>
                      <CardTitle>Group Chat</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                      {group.department && (
                        <div className="flex gap-2 mt-2">
                          <Badge>{group.department}</Badge>
                          {group.subject && <Badge variant="outline">{group.subject}</Badge>}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[500px] pr-4 mb-4">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.user_id === user.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                {msg.user_id !== user.id && (
                                  <p className="text-xs font-semibold mb-1">
                                    {msg.profiles.full_name}
                                  </p>
                                )}
                                <p className="text-sm">{msg.message}</p>
                                <p className={`text-xs mt-1 ${
                                  msg.user_id === user.id
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        <Button type="submit" size="icon">
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="goals">
                  <GroupGoals groupId={groupId!} isAdmin={isAdmin} canModerate={isModerator} />
                </TabsContent>
                <TabsContent value="analytics">
                  <GroupAnalytics groupId={groupId!} />
                </TabsContent>
                {canManageMembers && (
                  <TabsContent value="manage">
                    <RoleManagement groupId={groupId!} isAdmin={isAdmin} />
                  </TabsContent>
                )}
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Group Chat</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                  {group.department && (
                    <div className="flex gap-2 mt-2">
                      <Badge>{group.department}</Badge>
                      {group.subject && <Badge variant="outline">{group.subject}</Badge>}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isMember ? (
                    <>
                      <ScrollArea className="h-[500px] pr-4 mb-4">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.user_id === user.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                {msg.user_id !== user.id && (
                                  <p className="text-xs font-semibold mb-1">
                                    {msg.profiles.full_name}
                                  </p>
                                )}
                                <p className="text-sm">{msg.message}</p>
                                <p className={`text-xs mt-1 ${
                                  msg.user_id === user.id
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        <Button type="submit" size="icon">
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Join this group</h3>
                      <p className="text-muted-foreground mb-4">
                        Join to participate in group discussions
                      </p>
                      <Button onClick={handleJoinGroup}>Join Group</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Group Info Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.course_code && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Course</p>
                    <p className="text-sm font-semibold">{group.course_code}</p>
                    <p className="text-sm">{group.course_name}</p>
                  </div>
                )}
                
                {group.study_topics && group.study_topics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {group.study_topics.map((topic, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {group.meeting_days && group.meeting_days.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meeting Days</p>
                    <p className="text-sm">{group.meeting_days.join(', ')}</p>
                  </div>
                )}

                {group.meeting_time && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meeting Time</p>
                    <p className="text-sm">{group.meeting_time}</p>
                  </div>
                )}

                {group.meeting_location && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-sm">{group.meeting_location}</p>
                  </div>
                )}

                {group.department && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Department</p>
                    <Badge>{group.department}</Badge>
                  </div>
                )}

                {group.max_members && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="text-sm">{members.length} / {group.max_members} members</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Online Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {members.filter(m => onlineUsers.has(m.user_id)).map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {member.profiles.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{member.profiles.full_name}</p>
                            {member.profiles.department && (
                              <p className="text-xs text-muted-foreground">
                                {member.profiles.department}
                              </p>
                            )}
                          </div>
                        </div>
                        {member.role === "admin" && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                        {member.role === "moderator" && (
                          <Badge variant="outline" className="text-xs">Moderator</Badge>
                        )}
                      </div>
                    ))}
                    {members.filter(m => onlineUsers.has(m.user_id)).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No members online
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupDetail;
