import { DashboardSidebar } from "@/components/DashboardSidebar";
import { SummaryCards } from "@/components/SummaryCards";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ProjectListPanel } from "@/components/ProjectListPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { useProjects } from "@/hooks/useProjects";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { data: projects = [], isLoading, refetch, isRefetching } = useProjects();

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
          <div>
            <h1 className="text-lg font-semibold">AI PMO Dashboard</h1>
            <p className="text-xs text-muted-foreground">Salesforce-powered project analytics</p>
          </div>
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
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <SummaryCards projects={projects} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProjectsTable projects={projects} isLoading={isLoading} />
            </div>
            <div className="space-y-6">
              <ProjectListPanel projects={projects} isLoading={isLoading} />
            </div>
          </div>

          <AIInsightsPanel projects={projects} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
};

export default Index;
