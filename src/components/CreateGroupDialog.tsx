import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { useNotificationSystem } from "@/hooks/use-notification-system";

interface CreateGroupDialogProps {
  userId: string;
  onGroupCreated: () => void;
}

const CreateGroupDialog = ({ userId, onGroupCreated }: CreateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { createNewGroupNotification } = useNotificationSystem();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const maxMembers = formData.get("max_members") as string;
    const groupName = formData.get("name") as string;
    const visibility = formData.get("visibility") as string;
    
    // Parse meeting days from checkboxes
    const meetingDays = Array.from(formData.getAll("meeting_days")) as string[];
    
    // Parse study topics (comma-separated)
    const studyTopicsInput = formData.get("study_topics") as string;
    const studyTopics = studyTopicsInput ? studyTopicsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    
    const { data, error } = await supabase
      .from("study_groups")
      .insert({
        name: groupName,
        description: formData.get("description") as string,
        course_name: formData.get("course_name") as string,
        course_code: formData.get("course_code") as string,
        department: formData.get("department") as string,
        subject: formData.get("subject") as string,
        study_topics: studyTopics,
        meeting_days: meetingDays,
        meeting_time: formData.get("meeting_time") as string || null,
        meeting_location: formData.get("meeting_location") as string,
        visibility: visibility,
        max_members: maxMembers ? parseInt(maxMembers) : 10,
        creator_id: userId,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } else {
      // Create notifications for public groups
      if (visibility === "public" && data) {
        await createNewGroupNotification({
          groupId: data.id,
          groupName: groupName,
          creatorId: userId,
        });
      }

      toast({
        title: "Success!",
        description: "Group created successfully",
      });
      setOpen(false);
      onGroupCreated();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
          <DialogDescription>
            Create a new study group and invite others to join
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Advanced Algorithms Study Group"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course_name">Course Name</Label>
              <Input
                id="course_name"
                name="course_name"
                placeholder="e.g., Data Structures"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course_code">Course Code</Label>
              <Input
                id="course_code"
                name="course_code"
                placeholder="e.g., CS201"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A group for studying advanced algorithms and data structures"
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="study_topics">Study Topics</Label>
            <Input
              id="study_topics"
              name="study_topics"
              placeholder="e.g., Sorting, Searching, Trees (comma-separated)"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter topics separated by commas
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select name="department" required>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject/Topic</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g., Algorithms"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meeting Days</Label>
            <div className="grid grid-cols-4 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="meeting_days"
                    value={day}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_time">Preferred Meeting Time</Label>
              <Input
                id="meeting_time"
                name="meeting_time"
                type="time"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_location">Meeting Location</Label>
              <Input
                id="meeting_location"
                name="meeting_location"
                placeholder="e.g., Library Room 203"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select name="visibility" defaultValue="public" required>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can join</SelectItem>
                <SelectItem value="private">Private - Approval required</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max_members">Maximum Members (3-10)</Label>
            <Input
              id="max_members"
              name="max_members"
              type="number"
              placeholder="10"
              min={3}
              max={10}
              defaultValue={10}
              required
            />
            <p className="text-xs text-muted-foreground">
              Groups must have between 3-10 members
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
