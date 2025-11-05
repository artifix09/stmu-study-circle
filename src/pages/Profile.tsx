import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Award, LogOut, ArrowLeft } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { NotificationCenter } from "@/components/NotificationCenter";

interface Profile {
  id: string;
  full_name: string;
  department: string | null;
  semester: number | null;
  interests: string[] | null;
  avatar_url: string | null;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: {
    name: string;
    description: string | null;
    icon: string | null;
  };
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchProfile(session.user.id);
      await fetchBadges(session.user.id);
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

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else {
      setProfile(data);
    }
  };

  const fetchBadges = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching badges:", error);
    } else {
      setUserBadges(data || []);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const interests = formData.get("interests") as string;
    const interestsArray = interests ? interests.split(",").map(i => i.trim()) : [];

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        department: formData.get("department") as string,
        semester: parseInt(formData.get("semester") as string),
        interests: interestsArray,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await fetchProfile(user.id);
      setEditMode(false);
      toast({
        title: "Success!",
        description: "Profile updated successfully",
      });
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("new-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Password changed successfully",
      });
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">StudyHub</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your achievements</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="badges">Badges & Stats</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </div>
                  {!editMode && (
                    <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        defaultValue={profile.full_name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select name="department" defaultValue={profile.department || ""}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select your department" />
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
                      <Label htmlFor="semester">Semester</Label>
                      <Select name="semester" defaultValue={profile.semester?.toString() || ""}>
                        <SelectTrigger id="semester">
                          <SelectValue placeholder="Select your semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              {sem}th Semester
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interests">Interests (comma-separated)</Label>
                      <Textarea
                        id="interests"
                        name="interests"
                        defaultValue={profile.interests?.join(", ") || ""}
                        placeholder="Web Development, Machine Learning, Data Science"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p className="text-lg">{profile.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-lg">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="text-lg">{profile.department || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Semester</Label>
                      <p className="text-lg">
                        {profile.semester ? `${profile.semester}th Semester` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Interests</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.interests && profile.interests.length > 0 ? (
                          profile.interests.map((interest, idx) => (
                            <Badge key={idx} variant="secondary">
                              {interest}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No interests added</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Your Badges
                </CardTitle>
                <CardDescription>Achievements you've unlocked</CardDescription>
              </CardHeader>
              <CardContent>
                {userBadges.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {userBadges.map((userBadge) => (
                      <div
                        key={userBadge.id}
                        className="flex items-start gap-3 p-4 border rounded-lg"
                      >
                        <div className="text-3xl">{userBadge.badges.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{userBadge.badges.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {userBadge.badges.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No badges earned yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Join groups and attend sessions to earn badges!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participation Statistics</CardTitle>
                <CardDescription>Your activity overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-3xl font-bold text-primary">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Groups Joined</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-3xl font-bold text-secondary">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Sessions Attended</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-3xl font-bold text-accent">0</p>
                    <p className="text-sm text-muted-foreground mt-1">Sessions Organized</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      name="new-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Changing Password..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
