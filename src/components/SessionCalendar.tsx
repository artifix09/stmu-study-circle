import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isToday, isFuture, isPast } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudySession {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  group_id: string;
  study_groups: {
    name: string;
  };
  session_attendance?: {
    rsvp_status: string;
    user_id: string;
    attended: boolean;
  }[];
}

export function SessionCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const { toast } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (date) {
      fetchSessions();
    }
  }, [date, viewMode]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchSessions = async () => {
    if (!date) return;

    const start = viewMode === "month" 
      ? startOfMonth(date)
      : startOfWeek(date, { weekStartsOn: 0 });
    
    const end = viewMode === "month"
      ? endOfMonth(date)
      : endOfWeek(date, { weekStartsOn: 0 });

    const { data, error } = await supabase
      .from("study_sessions")
      .select(`
        *,
        study_groups (name),
        session_attendance (rsvp_status, user_id, attended)
      `)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Error fetching sessions:", error);
      return;
    }

    setSessions(data || []);
  };

  const handleRSVP = async (sessionId: string, status: "going" | "maybe" | "declined") => {
    if (!userId) return;

    const { error } = await supabase
      .from("session_attendance")
      .upsert({
        session_id: sessionId,
        user_id: userId,
        rsvp_status: status,
      }, {
        onConflict: "session_id,user_id"
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "RSVP Updated",
      description: `You are ${status === "going" ? "attending" : status === "maybe" ? "maybe attending" : "not attending"} this session`,
    });

    setSelectedSession(null);
    fetchSessions();
  };

  const handleCancelRegistration = async (sessionId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("session_attendance")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to cancel registration",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Registration Cancelled",
      description: "You have cancelled your registration for this session",
    });

    setSelectedSession(null);
    fetchSessions();
  };

  const getUserRSVP = (session: StudySession) => {
    return session.session_attendance?.find(a => a.user_id === userId)?.rsvp_status;
  };

  const getSessionsForDate = (checkDate: Date) => {
    return sessions.filter(session => 
      isSameDay(new Date(session.scheduled_at), checkDate)
    );
  };

  const isUpcoming = (sessionDate: string) => {
    const date = new Date(sessionDate);
    return isFuture(date) || isToday(date);
  };

  const modifiers = {
    hasSession: (day: Date) => getSessionsForDate(day).length > 0,
    hasUpcomingSession: (day: Date) => {
      const daySessions = getSessionsForDate(day);
      return daySessions.some(s => isUpcoming(s.scheduled_at));
    },
  };

  const modifiersClassNames = {
    hasSession: "bg-primary/10 font-semibold",
    hasUpcomingSession: "bg-primary/20 font-bold ring-2 ring-primary/50",
  };

  const renderWeekView = () => {
    if (!date) return null;

    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const daySessions = getSessionsForDate(day);
          const isCurrentDay = isToday(day);
          
          return (
            <Card 
              key={day.toISOString()} 
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                isCurrentDay && "ring-2 ring-primary"
              )}
              onClick={() => setDate(day)}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-semibold text-center">
                  {format(day, "EEE")}
                  <div className={cn(
                    "text-2xl font-bold mt-1",
                    isCurrentDay && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {daySessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No sessions
                      </p>
                    ) : (
                      daySessions.map((session) => {
                        const userRSVP = getUserRSVP(session);
                        const upcoming = isUpcoming(session.scheduled_at);
                        
                        return (
                          <div
                            key={session.id}
                            className={cn(
                              "p-2 rounded-md text-xs cursor-pointer transition-colors",
                              upcoming ? "bg-primary/10 hover:bg-primary/20" : "bg-muted hover:bg-muted/80"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSession(session);
                            }}
                          >
                            <div className="font-semibold truncate">{session.title}</div>
                            <div className="flex items-center gap-1 text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(session.scheduled_at), "h:mm a")}
                            </div>
                            {userRSVP && (
                              <Badge
                                variant={userRSVP === "going" ? "default" : userRSVP === "maybe" ? "secondary" : "outline"}
                                className="mt-1 text-xs"
                              >
                                {userRSVP}
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Study Sessions Calendar
          </h2>
          <p className="text-muted-foreground mt-1">
            View and manage your study sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Monthly
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Weekly
          </Button>
        </div>
      </div>

      {viewMode === "week" ? (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold">
              Week of {format(startOfWeek(date || new Date(), { weekStartsOn: 0 }), "MMMM d, yyyy")}
            </h3>
          </div>
          {renderWeekView()}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {format(date || new Date(), "MMMM yyyy")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Click on a date to view sessions
              </p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className={cn("rounded-md border pointer-events-auto")}
              />
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-primary/10 border" />
                  <span>Has sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-primary/20 ring-2 ring-primary/50" />
                  <span>Upcoming sessions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{date ? format(date, "MMMM d, yyyy") : "Select a date"}</span>
                {date && getSessionsForDate(date).length > 0 && (
                  <Badge variant="secondary">
                    {getSessionsForDate(date).length} session{getSessionsForDate(date).length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {date && getSessionsForDate(date).length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        No sessions scheduled for this date
                      </p>
                    </div>
                  ) : (
                    getSessionsForDate(date || new Date()).map((session) => {
                      const userRSVP = getUserRSVP(session);
                      const upcoming = isUpcoming(session.scheduled_at);
                      const past = isPast(new Date(session.scheduled_at)) && !isToday(new Date(session.scheduled_at));
                      
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            "border rounded-lg p-4 hover:bg-accent cursor-pointer transition-all hover:shadow-md",
                            upcoming && "ring-2 ring-primary/20",
                            past && "opacity-60"
                          )}
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{session.title}</h3>
                            {userRSVP && (
                              <Badge
                                variant={
                                  userRSVP === "going"
                                    ? "default"
                                    : userRSVP === "maybe"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {userRSVP}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {session.study_groups.name}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(session.scheduled_at), "h:mm a")} ({session.duration_minutes} min)
                            </span>
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {session.location}
                              </span>
                            )}
                          </div>
                          {upcoming && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                              <AlertCircle className="w-3 h-3" />
                              <span>Upcoming</span>
                            </div>
                          )}
                          {past && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Past session
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedSession && (
        <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedSession.title}</DialogTitle>
              <DialogDescription>
                {selectedSession.study_groups.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedSession.description && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">{selectedSession.description}</p>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{format(new Date(selectedSession.scheduled_at), "EEEE, MMMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">{format(new Date(selectedSession.scheduled_at), "h:mm a")}</p>
                    <p className="text-xs text-muted-foreground">{selectedSession.duration_minutes} minutes duration</p>
                  </div>
                </div>
                {selectedSession.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedSession.location}</p>
                      <p className="text-xs text-muted-foreground">Location</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedSession.session_attendance?.filter(a => a.rsvp_status === "going").length || 0} attending
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedSession.session_attendance?.length || 0} total registered
                    </p>
                  </div>
                </div>
              </div>

              {isUpcoming(selectedSession.scheduled_at) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your RSVP:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleRSVP(selectedSession.id, "going")}
                      size="sm"
                      variant={getUserRSVP(selectedSession) === "going" ? "default" : "outline"}
                      className="w-full"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Going
                    </Button>
                    <Button
                      onClick={() => handleRSVP(selectedSession.id, "maybe")}
                      size="sm"
                      variant={getUserRSVP(selectedSession) === "maybe" ? "default" : "outline"}
                      className="w-full"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Maybe
                    </Button>
                    <Button
                      onClick={() => handleRSVP(selectedSession.id, "declined")}
                      size="sm"
                      variant={getUserRSVP(selectedSession) === "declined" ? "destructive" : "outline"}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-1" />
                      No
                    </Button>
                  </div>
                  {getUserRSVP(selectedSession) && (
                    <Button
                      onClick={() => handleCancelRegistration(selectedSession.id)}
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2"
                    >
                      Cancel Registration
                    </Button>
                  )}
                </div>
              )}

              {isPast(new Date(selectedSession.scheduled_at)) && !isToday(new Date(selectedSession.scheduled_at)) && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">This session has already ended</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}