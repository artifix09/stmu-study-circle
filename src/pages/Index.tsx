import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Calendar, MessageSquare, Award, TrendingUp, Zap, Target, BarChart3, BookOpen, Star, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 hover:shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STMU STUDY CIRCLE
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")} className="hover:scale-105 transition-transform">
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate("/auth")} className="hover:scale-105 transition-all shadow-md hover:shadow-xl">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge variant="secondary" className="w-fit">
                <Zap className="w-3 h-3 mr-1" />
                Transform Your Learning Experience
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                Study Smarter,
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent block mt-2">
                  Together at STMU
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                Join St. Mary's University students in collaborative study groups, schedule sessions, and achieve your academic excellence with peers who share your dedication.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="text-lg px-8 py-6 hover:scale-105 transition-all shadow-xl hover:shadow-2xl"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Start Learning Today
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate("/groups")}
                  className="text-lg px-8 py-6 hover:scale-105 transition-all"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Explore Groups
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-6">
                <div>
                  <p className="text-3xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Active Students</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-accent">100+</p>
                  <p className="text-sm text-muted-foreground">Study Groups</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-3xl font-bold text-secondary">95%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>
            <div className="relative lg:scale-110 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30 rounded-3xl blur-3xl animate-pulse" />
              <img
                src={heroImage}
                alt="STMU students collaborating in study group"
                className="relative rounded-3xl shadow-2xl ring-1 ring-primary/10 hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-2xl shadow-xl border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Top Rated Platform</p>
                    <p className="text-sm text-muted-foreground">4.9/5 Student Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <Badge variant="outline" className="mb-4">
              <Shield className="w-3 h-3 mr-1" />
              Everything You Need
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Features Built for Excellence
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful tools designed to elevate your collaborative learning experience at STMU
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid md:grid-cols-6 lg:grid-cols-6 gap-6 auto-rows-fr">
            {/* Large Feature 1 */}
            <Card className="md:col-span-3 lg:col-span-3 border-none shadow-xl bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Smart Group Matching</CardTitle>
                <CardDescription className="text-base">
                  AI-powered recommendations connect you with students in your department, interests, and academic goals for optimal learning partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>98% Match Accuracy</span>
                </div>
              </CardContent>
            </Card>

            {/* Medium Feature 2 */}
            <Card className="md:col-span-3 lg:col-span-3 border-none shadow-xl bg-gradient-to-br from-secondary/5 to-primary/5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Session Scheduling</CardTitle>
                <CardDescription className="text-base">
                  Organize study sessions with integrated calendar, automatic reminders, and RSVP tracking for seamless coordination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Instant Notifications</span>
                </div>
              </CardContent>
            </Card>

            {/* Small Feature 3 */}
            <Card className="md:col-span-2 lg:col-span-2 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Real-time Chat</CardTitle>
                <CardDescription>
                  Instant messaging with live presence indicators
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Small Feature 4 */}
            <Card className="md:col-span-2 lg:col-span-2 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Gamification</CardTitle>
                <CardDescription>
                  Earn badges and track your learning streaks
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Small Feature 5 */}
            <Card className="md:col-span-2 lg:col-span-2 border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track attendance and group performance
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Medium Feature 6 */}
            <Card className="md:col-span-3 lg:col-span-3 border-none shadow-xl bg-gradient-to-br from-accent/5 to-secondary/5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Progress Tracking</CardTitle>
                <CardDescription className="text-base">
                  Set collaborative goals, visualize achievements, and monitor your group's journey to academic success
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-accent font-medium">
                  <Star className="w-4 h-4" />
                  <span>Visual Progress Indicators</span>
                </div>
              </CardContent>
            </Card>

            {/* Medium Feature 7 */}
            <Card className="md:col-span-3 lg:col-span-3 border-none shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
              <CardHeader className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Personalized Recommendations</CardTitle>
                <CardDescription className="text-base">
                  Discover relevant study groups tailored to your academic profile, semester, and learning preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Suggestions</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "500+", label: "Active Students", color: "primary" },
              { icon: BookOpen, value: "100+", label: "Study Groups", color: "accent" },
              { icon: Calendar, value: "1000+", label: "Sessions Held", color: "secondary" },
              { icon: Award, value: "95%", label: "Success Rate", color: "primary" },
            ].map((stat, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardContent className="pt-6 text-center">
                  <div className={`w-16 h-16 bg-${stat.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-8 h-8 text-${stat.color}`} />
                  </div>
                  <p className={`text-4xl font-extrabold text-${stat.color} mb-2`}>{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Join STMU Study Circle Today
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-extrabold leading-tight">
              Ready to Transform Your 
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent block mt-2">
                Academic Journey?
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of STMU students already achieving academic excellence through collaborative learning
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="text-lg px-10 py-7 hover:scale-110 transition-all shadow-2xl"
              >
                <GraduationCap className="w-6 h-6 mr-2" />
                Create Your Free Account
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-10 py-7 hover:scale-110 transition-all"
              >
                <MessageSquare className="w-6 h-6 mr-2" />
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  STMU STUDY CIRCLE
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering St. Mary's University students to achieve academic excellence through collaborative learning.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Features</li>
                <li className="hover:text-primary transition-colors cursor-pointer">How It Works</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Success Stories</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Study Guides</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-primary transition-colors cursor-pointer">FAQs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Terms of Service</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 STMU Study Circle. Empowering students to learn together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
