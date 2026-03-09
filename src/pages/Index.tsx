import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ExecutiveKPIs } from "@/components/ExecutiveKPIs";
import { EnhancedProjectsTable } from "@/components/EnhancedProjectsTable";
import { ProjectCharts } from "@/components/ProjectCharts";
import { RiskOverview } from "@/components/RiskOverview";
import { EnhancedAIInsights } from "@/components/EnhancedAIInsights";
import { useProjects, useProjectStats } from "@/hooks/useProjects";
import { RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const Index = () => {
  const { data: projects = [], isLoading, refetch, isRefetching, dataUpdatedAt } = useProjects();
  const stats = useProjectStats(projects);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Update last refresh time
  useEffect(() => {
    if (dataUpdatedAt) {
      const date = new Date(dataUpdatedAt);
      setLastUpdate(date.toLocaleTimeString());
    }
  }, [dataUpdatedAt]);

  // Filter high risk projects for the risk overview
  const highRiskProjects = projects.filter(p => 
    p.Risk_Level__c === "High" || p.Health_Status__c === "At Risk"
  );

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold">AI PMO Dashboard</h1>
            <p className="text-xs text-muted-foreground">Real-time Salesforce project analytics</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <Badge variant="outline" className="gap-1.5 text-xs font-normal">
                <Clock className="h-3 w-3" />
                Last update: {lastUpdate}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Auto-refresh: 60s
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto bg-background">
          {/* Executive Summary - KPI Cards */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Executive Summary
            </h2>
            <ExecutiveKPIs
              total={stats.total}
              active={stats.active}
              completed={stats.completed}
              delayed={stats.delayed}
              highRisk={stats.highRisk}
              isLoading={isLoading}
            />
          </section>

          {/* Charts Section */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Project Status Visualization
            </h2>
            <ProjectCharts
              statusCounts={stats.statusCounts}
              priorityCounts={stats.priorityCounts}
              monthlyTrend={stats.monthlyTrend}
              isLoading={isLoading}
            />
          </section>

          {/* Projects Table and Risk Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Projects Table
              </h2>
              <EnhancedProjectsTable projects={projects} isLoading={isLoading} />
            </div>
            <div className="xl:col-span-1">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Risk Overview
              </h2>
              <RiskOverview
                highRiskProjects={highRiskProjects}
                nearingDeadline={stats.nearingDeadline}
                overBudget={stats.overBudget}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* AI Insights */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              AI-Powered Insights
            </h2>
            <EnhancedAIInsights
              projects={projects}
              stats={stats}
              isLoading={isLoading}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
