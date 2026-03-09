import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Users, AlertTriangle, CalendarClock, Sparkles } from "lucide-react";
import { useProjects, useProjectStats } from "@/hooks/useProjects";

const kpiConfig = [
  { title: "Total Projects", icon: FolderKanban, bg: "bg-primary/8", iconColor: "text-primary", key: "total" as const },
  { title: "Active", icon: Users, bg: "bg-success/8", iconColor: "text-success", key: "active" as const },
  { title: "At Risk", icon: AlertTriangle, bg: "bg-destructive/8", iconColor: "text-destructive", key: "risk" as const },
  { title: "Deadlines (30d)", icon: CalendarClock, bg: "bg-warning/8", iconColor: "text-warning", key: "deadline" as const },
];

function ragBorder(rag?: string) {
  if (rag === "Red") return "border-l-rag-red";
  if (rag === "Amber") return "border-l-rag-amber";
  if (rag === "Green") return "border-l-rag-green";
  return "border-l-border";
}

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();
  const stats = useProjectStats(projects);

  const kpiValues: Record<string, number> = {
    total: stats.total,
    active: stats.active,
    risk: stats.highRisk,
    deadline: stats.nearingDeadline.length,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold">Hi There</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Here's what's happening across your portfolio today</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiConfig.map(({ title, icon: Icon, bg, iconColor, key }) => (
          <Card key={key} className="border">
            <CardContent className="p-4">
              {isLoading ? (
                <><Skeleton className="h-8 w-12 mb-1" /><Skeleton className="h-3 w-20" /></>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold">{kpiValues[key]}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{title}</p>
                  </div>
                  <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Briefing */}
      <Card className="border border-primary/15 bg-primary/[0.02]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium">AI Briefing</span>
          </div>
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div>
          ) : (
            <ul className="space-y-2 text-[13px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                {stats.highRisk} project{stats.highRisk !== 1 ? "s" : ""} flagged Red/Amber requiring attention.
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                {stats.nearingDeadline.length} deadline{stats.nearingDeadline.length !== 1 ? "s" : ""} approaching within 30 days.
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                {stats.overBudget.length > 0
                  ? `${stats.overBudget.length} project${stats.overBudget.length !== 1 ? "s" : ""} over budget.`
                  : "All projects within budget."}
              </li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Budget Warning */}
      {!isLoading && stats.overBudget.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-xs font-medium text-warning">⚠ Budget Warning</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {stats.overBudget.map(p => p.Project_Name__c || p.Name).join(", ")} over budget.
          </p>
        </div>
      )}

      {/* Recent Projects */}
      <div>
        <h2 className="text-sm font-medium mb-3">Recent Projects</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border"><CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" /><Skeleton className="h-2 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border">
            <CardContent className="p-10 flex flex-col items-center text-center">
              <FolderKanban className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Projects from Salesforce will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {projects.slice(0, 9).map(project => {
              const progress = project.Percent_Complete__c ?? 0;
              return (
                <Card key={project.Id} className={`border border-l-2 ${ragBorder(project.RAG__c)}`}>
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-medium">{project.Project_Name__c || project.Name}</p>
                        <p className="text-[11px] text-muted-foreground">{project.Coordinator__c}</p>
                      </div>
                      <Badge variant={project.Status__c === "Active" || project.Status__c === "In Progress" ? "default" : "secondary"} className="text-[10px]">
                        {project.Status__c}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
