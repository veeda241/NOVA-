import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NovaMascot } from "@/components/NovaMascot";
import { Users, Activity, TrendingUp, AlertCircle } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <NovaMascot size="sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              NOVA Admin
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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">System overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 gradient-primary rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 gradient-primary rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className="text-2xl font-bold">7.8/10</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-glow transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent rounded-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {/* User Management */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">john@example.com</p>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-muted-foreground">jane@example.com</p>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Alex Johnson</p>
                  <p className="text-sm text-muted-foreground">alex@example.com</p>
                </div>
                <Button size="sm" variant="outline">View</Button>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Users
            </Button>
          </Card>

          {/* System Analytics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Analytics</h2>
            <div className="space-y-4">
              {[
                { label: "Session Completion Rate", value: "94%", color: "bg-primary" },
                { label: "User Satisfaction", value: "4.8/5", color: "bg-accent" },
                { label: "System Uptime", value: "99.9%", color: "bg-primary" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full" />
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 gradient-primary" asChild>
              <Link to="/analysis">View Detailed Analytics</Link>
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;