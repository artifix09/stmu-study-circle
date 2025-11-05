import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Target, Plus, TrendingUp } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  created_at: string;
}

interface GroupGoalsProps {
  groupId: string;
  isAdmin: boolean;
  canModerate?: boolean;
}

export function GroupGoals({ groupId, isAdmin, canModerate = false }: GroupGoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const canCreateGoals = isAdmin;
  const canUpdateProgress = isAdmin || canModerate;

  useEffect(() => {
    fetchGoals();
  }, [groupId]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("group_goals")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
      return;
    }

    setGoals(data || []);
  };

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("group_goals").insert({
      group_id: groupId,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      target_value: parseInt(formData.get("target_value") as string),
      created_by: user.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Goal created successfully",
      });
      setOpen(false);
      fetchGoals();
      (e.target as HTMLFormElement).reset();
    }

    setLoading(false);
  };

  const handleUpdateProgress = async (goalId: string, newValue: number) => {
    const { error } = await supabase
      .from("group_goals")
      .update({ current_value: newValue })
      .eq("id", goalId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated!",
        description: "Progress updated successfully",
      });
      fetchGoals();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Group Goals
        </h3>
        {canCreateGoals && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>
                  Set a goal for the group to track progress
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Goal Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Complete 10 study sessions"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Details about this goal..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    name="target_value"
                    type="number"
                    min="1"
                    defaultValue="100"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Goal"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No goals set yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const percentage = Math.min(
              Math.round((goal.current_value / goal.target_value) * 100),
              100
            );

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {goal.current_value} / {goal.target_value}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={percentage} className="mb-3" />
                  {canUpdateProgress && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateProgress(
                            goal.id,
                            Math.max(0, goal.current_value - 1)
                          )
                        }
                        disabled={goal.current_value === 0}
                      >
                        -
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          handleUpdateProgress(goal.id, goal.current_value + 1)
                        }
                        disabled={goal.current_value >= goal.target_value}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Update Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateProgress(
                            goal.id,
                            Math.min(goal.target_value, goal.current_value + 1)
                          )
                        }
                        disabled={goal.current_value >= goal.target_value}
                      >
                        +
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}