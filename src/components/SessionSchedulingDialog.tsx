import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Shield } from "lucide-react";
import type { GroupRole } from "@/hooks/use-group-role";

interface SessionSchedulingDialogProps {
  groupId: string;
  onSessionCreated: () => void;
  userRole: GroupRole;
}

export function SessionSchedulingDialog({ groupId, onSessionCreated, userRole }: SessionSchedulingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const roleLabel = userRole === "admin" ? "Admin" : "Moderator";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const scheduledAt = new Date(`${date}T${time}`);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("study_sessions")
      .insert({
        group_id: groupId,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(formData.get("duration") as string),
        location: formData.get("location") as string,
        created_by: user.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Study session scheduled successfully",
      });
      setOpen(false);
      onSessionCreated();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Study Session
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Create a new study session for your group members ({roleLabel})</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Weekly Review Session"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What topics will be covered in this session?"
              className="min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                name="time"
                type="time"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue={60}
                min={15}
                max={480}
                step={15}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="Library Room 204"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}