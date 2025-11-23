import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NovaMascot } from "@/components/NovaMascot";
import { Heart, Activity, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStartNewSession = async () => {
    setLoading(true);
    toast.info("Starting new emotional analysis session...");
    try {
      const response = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Hello, I want to start a new session." }), // Mock message for now
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      toast.success("Analysis complete!");
      navigate("/analysis", { state: { analysisData: data.message } }); // Pass the analysis result
    } catch (error) {
      toast.error("Failed to start session. Please try again.");
      console.error("Error starting new session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <NovaMascot size="sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              NOVA
            </span>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">Logout</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2">Welcome back, Alex! 👋</h1>
          <p className="text-muted-foreground text-lg">Here's your emotional wellness overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 gradient-primary rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mood Score</p>
                <p className="text-2xl font-bold">8.5/10</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 gradient-primary rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="text-2xl font-bold">+12%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">7 days</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Cards */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* Recent Analysis */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Emotional Analysis</h2>
            <div className="space-y-4">
              {[
                { emotion: "Joy", value: 85, color: "bg-primary" },
                { emotion: "Calm", value: 70, color: "bg-accent" },
                { emotion: "Confidence", value: 60, color: "bg-primary" },
              ].map((item) => (
                <div key={item.emotion}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{item.emotion}</span>
                    <span className="text-sm text-muted-foreground">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 gradient-primary" asChild>
              <Link to="/analysis">View Full Analysis</Link>
            </Button>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={handleStartNewSession} disabled={loading}>
                {loading ? 'Analyzing...' : 'Start New Session'}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View History
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Download Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Schedule Check-in
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;