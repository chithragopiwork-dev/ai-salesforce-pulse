import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Users, AlertTriangle, CalendarClock, Sparkles } from "lucide-react";
import { useProjects, useProjectStats } from "@/hooks/useProjects";

function KPICard({ title, value, icon: Icon, color, isLoading }: {
  title: string; value: number | string; icon: any; color: string; isLoading: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();
  const stats = useProjectStats(projects);
  const greeting = new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Projects" value={stats.total} icon={FolderKanban} color="bg-primary" isLoading={isLoading} />
        <KPICard title="Active Team Members" value={stats.active} icon={Users} color="bg-success" isLoading={isLoading} />
        <KPICard title="Critical Risks" value={stats.highRisk} icon={AlertTriangle} color="bg-destructive" isLoading={isLoading} />
        <KPICard title="Deadlines This Month" value={stats.nearingDeadline.length} icon={CalendarClock} color="bg-warning" isLoading={isLoading} />
      </div>

      {/* AI Daily Briefing */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Daily Briefing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{stats.highRisk} project{stats.highRisk !== 1 ? "s" : ""} flagged as high risk requiring attention.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                <span>{stats.nearingDeadline.length} deadline{stats.nearingDeadline.length !== 1 ? "s" : ""} approaching within the next 30 days.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>{stats.overBudget.length} project{stats.overBudget.length !== 1 ? "s" : ""} currently over budget.</span>
              </li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Smart Alert Banners */}
      {!isLoading && stats.overBudget.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning">⚠️ Budget Warning</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.overBudget.map(p => p.Name).join(", ")} {stats.overBudget.length === 1 ? "is" : "are"} over budget.
          </p>
        </div>
      )}

      {/* Recent Projects */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 8).map(project => (
                <div key={project.Id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{project.Name}</p>
                    <p className="text-xs text-muted-foreground">{project.Project_Manager__c}</p>
                  </div>
                  <Badge variant={
                    project.Status__c === "Active" ? "default" :
                    project.Status__c === "Completed" ? "secondary" :
                    "outline"
                  } className="text-xs">
                    {project.Status__c}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
