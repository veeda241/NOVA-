import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NovaMascot } from "@/components/NovaMascot";
import { Brain, Heart, Sparkles, TrendingUp } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <NovaMascot size="sm" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            NOVA
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
          <Button className="gradient-primary" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-6 animate-fade-in-up">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Understanding Emotions,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Empowering Connections
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              NOVA uses advanced emotional AI to analyze, understand, and respond to human emotions with empathy and precision.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="gradient-primary shadow-soft" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/signin">View Demo</Link>
              </Button>
            </div>
          </div>

          {/* Right Mascot */}
          <div className="flex-1 flex justify-center">
            <NovaMascot size="lg" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card p-6 rounded-lg shadow-soft border border-border hover:shadow-glow transition-all">
            <Brain className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-muted-foreground">
              Deep learning algorithms detect subtle emotional patterns in real-time.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-soft border border-border hover:shadow-glow transition-all">
            <Heart className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-2">Empathy First</h3>
            <p className="text-muted-foreground">
              Designed with human connection at its core, fostering understanding and care.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-soft border border-border hover:shadow-glow transition-all">
            <TrendingUp className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Actionable Insights</h3>
            <p className="text-muted-foreground">
              Transform emotional data into meaningful actions and improvements.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;