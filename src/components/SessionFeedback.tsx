import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export function SessionFeedback({ sessionId }: { sessionId: string }) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [userFeedback, setUserFeedback] = useState<Feedback | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedback();
  }, [sessionId]);

  const fetchFeedback = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch feedback with user profile information
    const { data: feedbackData, error } = await supabase
      .from("session_feedback")
      .select("id, rating, comment, created_at, user_id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      return;
    }


    if (!feedbackData) {
      setFeedback([]);
      return;
    }

    // Fetch profile information for each feedback
    const userIds = feedbackData.map(f => f.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const enrichedFeedback = feedbackData.map(f => ({
      ...f,
      profiles: {
        full_name: profileMap.get(f.user_id)?.full_name || "Unknown User"
      }
    }));

    setFeedback(enrichedFeedback);
    
    // Calculate average rating
    if (enrichedFeedback.length > 0) {
      const avg = enrichedFeedback.reduce((sum, f) => sum + f.rating, 0) / enrichedFeedback.length;
      setAverageRating(Math.round(avg * 10) / 10);
    }

    // Find user's feedback
    const usersFeedback = enrichedFeedback.find(f => f.user_id === user.id);
    setUserFeedback(usersFeedback || null);
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("session_feedback").upsert({
      session_id: sessionId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
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
        description: "Feedback submitted successfully",
      });
      setOpen(false);
      setRating(0);
      setComment("");
      fetchFeedback();
    }

    setLoading(false);
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= count
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Session Feedback
              </CardTitle>
              <CardDescription>
                {feedback.length} {feedback.length === 1 ? "review" : "reviews"}
                {averageRating > 0 && (
                  <span className="ml-2">• Average: {averageRating}/5</span>
                )}
              </CardDescription>
            </div>
            <Button onClick={() => setOpen(true)}>
              {userFeedback ? "Update Feedback" : "Leave Feedback"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No feedback yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share your experience!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {item.profiles.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold">{item.profiles.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {renderStars(item.rating)}
                      {item.comment && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {item.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Feedback</DialogTitle>
            <DialogDescription>
              Share your experience with this study session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              {renderStars(rating, true)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the session..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitFeedback} disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}