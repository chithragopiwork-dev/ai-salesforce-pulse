import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Clock, BarChart3 } from "lucide-react";
import type { SalesforceProject } from "@/services/salesforce";

interface AIInsightsPanelProps {
  projects: SalesforceProject[];
  isLoading: boolean;
}

export function AIInsightsPanel({ projects, isLoading }: AIInsightsPanelProps) {
  const total = projects.length;
  const recentProjects = projects.slice(-3);

  const insights = [
    {
      icon: BarChart3,
      title: "Portfolio Overview",
      description: `Your portfolio contains ${total} project${total !== 1 ? "s" : ""}. ${total > 5 ? "Consider reviewing resource allocation across projects." : "Good manageable size for close oversight."}`,
    },
    {
      icon: Clock,
      title: "Recently Added",
      description: recentProjects.length > 0
        ? `Latest projects: ${recentProjects.map((p) => p.Name).join(", ")}`
        : "No recent projects detected.",
    },
    {
      icon: TrendingUp,
      title: "Trend Analysis",
      description: total > 3
        ? "Project volume is growing. Consider scaling your PMO processes and team capacity."
        : "Steady project intake. Good time to establish baseline metrics.",
    },
  ];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
            </div>
          ))
        ) : (
          insights.map((insight, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/50">
              <div className="p-2 rounded-lg bg-primary/10 text-primary h-fit">
                <insight.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
