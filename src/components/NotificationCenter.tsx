import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, X, Trash2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata: any;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount((prev) => prev + 1);
            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const deleteNotification = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    
    toast({
      title: "Deleted",
      description: "Notification removed",
    });
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  const deleteAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('read', true);

    if (error) {
      console.error('Error deleting read notifications:', error);
      toast({
        title: "Error",
        description: "Failed to delete notifications",
        variant: "destructive",
      });
      return;
    }

    setNotifications((prev) => prev.filter((n) => !n.read));
    
    toast({
      title: "Success",
      description: "Read notifications cleared",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return '🏆';
      case 'session_reminder':
        return '⏰';
      case 'join_request_approved':
        return '✅';
      case 'join_request_rejected':
        return '❌';
      case 'new_group':
        return '👥';
      case 'new_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return 'text-yellow-500';
      case 'session_reminder':
        return 'text-blue-500';
      case 'join_request_approved':
        return 'text-green-500';
      case 'join_request_rejected':
        return 'text-red-500';
      case 'new_group':
        return 'text-purple-500';
      case 'new_message':
        return 'text-cyan-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:scale-105 transition-transform">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div>
            <h3 className="font-bold text-lg">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-8"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.some(n => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={deleteAllRead}
                className="text-xs h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">We'll notify you about important updates</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 hover:bg-accent transition-colors ${
                      !notification.read ? 'bg-accent/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-3xl ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <p className="font-semibold text-sm leading-tight">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs mt-1">New</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                          {!notification.read && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}