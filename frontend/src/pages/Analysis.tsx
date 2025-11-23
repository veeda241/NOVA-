import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NovaMascot } from "@/components/NovaMascot";
import { ArrowLeft, Download, Share2 } from "lucide-react";

const Analysis = () => {
  const location = useLocation();
  const analysisData = location.state?.analysisData;

  if (!analysisData) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">No Analysis Data</h1>
          <p className="text-muted-foreground">Please start a new session from the dashboard.</p>
          <Button className="mt-6" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Destructure the structured analysisData
  const { moodScore, emotionalBreakdown, overallSummary, insights } = analysisData;

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <NovaMascot size="sm" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              NOVA Analysis
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Analysis Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2">Emotional Analysis Report</h1>
          <p className="text-muted-foreground text-lg">Session Date: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Main Analysis Grid */}
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Primary Emotions */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-2xl font-semibold mb-6">Emotional Breakdown</h2>

            <div className="space-y-6">
              {emotionalBreakdown.map((item) => (
                <div key={item.emotion} className="space-y-2">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{item.emotion}</span>
                    <span className="text-2xl font-bold">{item.value}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  {item.desc && <p className="text-sm text-muted-foreground">{item.desc}</p>}
                </div>
              ))}
            </div>
          </Card>

          {/* Summary Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Overall Summary</h2>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 gradient-primary rounded-full flex items-center justify-center shadow-glow">
                  <span className="text-4xl font-bold text-white">{moodScore.toFixed(1)}</span>
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <NovaMascot size="sm" animated={false} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className={`font-semibold text-lg ${overallSummary.status === "Positive" ? "text-primary" : "text-destructive"}`}>{overallSummary.status}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Trend</p>
                <p className={`font-semibold text-lg ${overallSummary.trend.includes('Improving') ? "text-accent" : "text-destructive"}`}>{overallSummary.trend}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Recommendation</p>
                <p className="text-sm">{overallSummary.recommendation}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Insights */}
        <Card className="mt-6 p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-semibold mb-4">AI Insights & Recommendations</h2>
          <div className="space-y-4">
            {insights.map((item, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Analysis;