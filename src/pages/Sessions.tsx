import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, ArrowLeft, User as UserIcon } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { SessionCalendar } from "@/components/SessionCalendar";
import { NotificationCenter } from "@/components/NotificationCenter";

const Sessions = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 hover:shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/dashboard")}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                STMU STUDY CIRCLE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="hover:scale-105 transition-transform">
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:scale-105 transition-transform">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <SessionCalendar />
      </main>
    </div>
  );
};

export default Sessions;