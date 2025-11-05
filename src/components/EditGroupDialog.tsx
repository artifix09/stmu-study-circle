import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

interface GroupData {
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
}

interface EditGroupDialogProps {
  groupId: string;
  onGroupUpdated: () => void;
}

export const EditGroupDialog = ({ groupId, onGroupUpdated }: EditGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchGroupData();
    }
  }, [open, groupId]);

  const fetchGroupData = async () => {
    const { data, error } = await supabase
      .from("study_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (!error && data) {
      setGroupData(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const maxMembers = formData.get("max_members") as string;
    
    const meetingDays = Array.from(formData.getAll("meeting_days")) as string[];
    const studyTopicsInput = formData.get("study_topics") as string;
    const studyTopics = studyTopicsInput ? studyTopicsInput.split(',').map(t => t.trim()).filter(t => t) : [];

    const { error } = await supabase
      .from("study_groups")
      .update({
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        course_name: formData.get("course_name") as string,
        course_code: formData.get("course_code") as string,
        department: formData.get("department") as string,
        subject: formData.get("subject") as string,
        study_topics: studyTopics,
        meeting_days: meetingDays,
        meeting_time: formData.get("meeting_time") as string || null,
        meeting_location: formData.get("meeting_location") as string,
        visibility: formData.get("visibility") as string,
        max_members: maxMembers ? parseInt(maxMembers) : 10,
      })
      .eq("id", groupId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
      setOpen(false);
      onGroupUpdated();
    }
    setLoading(false);
  };

  if (!groupData) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Study Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={groupData.name}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course_name">Course Name</Label>
              <Input
                id="course_name"
                name="course_name"
                defaultValue={groupData.course_name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course_code">Course Code</Label>
              <Input
                id="course_code"
                name="course_code"
                defaultValue={groupData.course_code || ""}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={groupData.description || ""}
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="study_topics">Study Topics</Label>
            <Input
              id="study_topics"
              name="study_topics"
              defaultValue={groupData.study_topics?.join(', ') || ""}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select name="department" defaultValue={groupData.department || ""} required>
                <SelectTrigger id="department">
                  <SelectValue />
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
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={groupData.subject || ""}
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
                    defaultChecked={groupData.meeting_days?.includes(day)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_time">Meeting Time</Label>
              <Input
                id="meeting_time"
                name="meeting_time"
                type="time"
                defaultValue={groupData.meeting_time || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_location">Location</Label>
              <Input
                id="meeting_location"
                name="meeting_location"
                defaultValue={groupData.meeting_location || ""}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select name="visibility" defaultValue={groupData.visibility} required>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_members">Max Members (3-10)</Label>
            <Input
              id="max_members"
              name="max_members"
              type="number"
              min={3}
              max={10}
              defaultValue={groupData.max_members || 10}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
