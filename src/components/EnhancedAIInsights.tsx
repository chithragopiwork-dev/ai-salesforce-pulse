import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Clock, BarChart3, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { SalesforceProject } from "@/services/salesforce";

interface EnhancedAIInsightsProps {
  projects: SalesforceProject[];
  stats: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
    highRisk: number;
    nearingDeadline: SalesforceProject[];
    overBudget: SalesforceProject[];
  };
  isLoading: boolean;
}

export function EnhancedAIInsights({ projects, stats, isLoading }: EnhancedAIInsightsProps) {
  // Calculate insights
  const totalBudget = projects.reduce((sum, p) => sum + (p.Budget__c || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (p.Actual_Cost__c || 0), 0);
  const budgetUtilization = totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0;
  
  // Portfolio health score (0-100)
  const healthyProjects = projects.filter(p => p.Health_Status__c === "Healthy").length;
  const portfolioHealthScore = projects.length > 0 
    ? Math.round((healthyProjects / projects.length) * 100) 
    : 100;

  // Recently started projects (within 30 days)
  const today = new Date();
  const recentlyStarted = projects.filter(p => {
    if (!p.Start_Date__c) return false;
    const startDate = new Date(p.Start_Date__c);
    const daysSinceStart = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceStart >= 0 && daysSinceStart <= 30;
  });

  // Highest budget projects
  const topBudgetProjects = [...projects]
    .sort((a, b) => (b.Budget__c || 0) - (a.Budget__c || 0))
    .slice(0, 3);

  // Projects likely to miss deadline (delayed + at risk + nearing deadline)
  const atRiskOfMissing = projects.filter(p => 
    p.Status__c === "Delayed" || 
    p.Health_Status__c === "At Risk" || 
    stats.nearingDeadline.includes(p)
  );

  const insights = [
    {
      icon: BarChart3,
      title: "Portfolio Health",
      description: `Overall portfolio health score: ${portfolioHealthScore}%. ${
        portfolioHealthScore >= 80 
          ? "Excellent portfolio performance!" 
          : portfolioHealthScore >= 60 
            ? "Some projects need attention." 
            : "Multiple projects require immediate intervention."
      }`,
      color: portfolioHealthScore >= 80 ? "text-success" : portfolioHealthScore >= 60 ? "text-warning" : "text-destructive",
      bgColor: portfolioHealthScore >= 80 ? "bg-success/10" : portfolioHealthScore >= 60 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      icon: AlertTriangle,
      title: "Deadline Risk Analysis",
      description: atRiskOfMissing.length > 0
        ? `${atRiskOfMissing.length} project${atRiskOfMissing.length !== 1 ? "s" : ""} may miss ${atRiskOfMissing.length !== 1 ? "their" : "its"} deadline: ${atRiskOfMissing.slice(0, 2).map(p => p.Name).join(", ")}${atRiskOfMissing.length > 2 ? ` and ${atRiskOfMissing.length - 2} more` : ""}.`
        : "All projects are on track to meet their deadlines.",
      color: atRiskOfMissing.length > 0 ? "text-warning" : "text-success",
      bgColor: atRiskOfMissing.length > 0 ? "bg-warning/10" : "bg-success/10",
    },
    {
      icon: DollarSign,
      title: "Budget Utilization",
      description: `Current budget utilization: ${budgetUtilization.toFixed(0)}% ($${totalActualCost.toLocaleString()} of $${totalBudget.toLocaleString()}). ${
        stats.overBudget.length > 0 
          ? `${stats.overBudget.length} project${stats.overBudget.length !== 1 ? "s are" : " is"} over budget.`
          : "All projects within budget."
      }`,
      color: budgetUtilization <= 90 ? "text-success" : budgetUtilization <= 100 ? "text-warning" : "text-destructive",
      bgColor: budgetUtilization <= 90 ? "bg-success/10" : budgetUtilization <= 100 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      icon: TrendingUp,
      title: "Highest Budget Projects",
      description: topBudgetProjects.length > 0
        ? `Top investments: ${topBudgetProjects.map(p => `${p.Name} ($${(p.Budget__c || 0).toLocaleString()})`).join(", ")}.`
        : "No budget data available.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Clock,
      title: "Recently Started",
      description: recentlyStarted.length > 0
        ? `${recentlyStarted.length} project${recentlyStarted.length !== 1 ? "s" : ""} started in the last 30 days: ${recentlyStarted.slice(0, 2).map(p => p.Name).join(", ")}${recentlyStarted.length > 2 ? ` +${recentlyStarted.length - 2} more` : ""}.`
        : "No new projects started in the last 30 days.",
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: CheckCircle2,
      title: "Completion Rate",
      description: `${stats.completed} of ${stats.total} projects completed (${stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}%). ${
        stats.active > 0 ? `${stats.active} project${stats.active !== 1 ? "s" : ""} currently active.` : ""
      }`,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-Powered Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div key={i} className={`flex gap-3 p-4 rounded-lg ${insight.bgColor}`}>
                <div className={`p-2 rounded-lg bg-card h-fit ${insight.color}`}>
                  <insight.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
