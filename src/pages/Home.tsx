import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Users, AlertTriangle, CalendarClock, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useProjects, useProjectStats } from "@/hooks/useProjects";

function KPICard({ title, value, icon: Icon, gradientClass, trend, isLoading }: {
  title: string; value: number | string; icon: any; gradientClass: string; trend?: "up" | "down" | "flat"; isLoading: boolean;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card className="shadow-lg card-hover rounded-2xl overflow-hidden border-0">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={`${gradientClass} w-20 flex items-center justify-center shrink-0`}>
            <Icon className="h-7 w-7 text-white drop-shadow-md" />
          </div>
          <div className="flex-1 p-5">
            {isLoading ? (
              <><Skeleton className="h-10 w-16 mb-2" /><Skeleton className="h-4 w-24" /></>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <p className="text-5xl font-extrabold leading-none tracking-tight">{value}</p>
                  {trend && (
                    <TrendIcon className={`h-4 w-4 mb-1 ${trendColor}`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">{title}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ragBorderClass(rag?: string) {
  if (rag === "Red") return "border-l-[hsl(0,84%,60%)]";
  if (rag === "Amber") return "border-l-[hsl(38,92%,50%)]";
  if (rag === "Green") return "border-l-[hsl(160,84%,39%)]";
  return "border-l-muted";
}

export default function Home() {
  const { data: projects = [], isLoading } = useProjects();
  const stats = useProjectStats(projects);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Hi There 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your portfolio today</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard title="Total Projects" value={stats.total} icon={FolderKanban} gradientClass="kpi-blue" trend="up" isLoading={isLoading} />
        <KPICard title="Active Projects" value={stats.active} icon={Users} gradientClass="kpi-green" trend="up" isLoading={isLoading} />
        <KPICard title="At Risk (RAG)" value={stats.highRisk} icon={AlertTriangle} gradientClass="kpi-red" trend={stats.highRisk > 0 ? "up" : "flat"} isLoading={isLoading} />
        <KPICard title="Deadlines This Month" value={stats.nearingDeadline.length} icon={CalendarClock} gradientClass="kpi-orange" trend="flat" isLoading={isLoading} />
      </div>

      {/* AI Daily Briefing */}
      <Card className="rounded-2xl border-2 border-transparent bg-clip-padding shadow-xl animate-ai-glow relative overflow-hidden"
        style={{ borderImage: 'linear-gradient(135deg, hsl(262 52% 47%), hsl(217 91% 60%)) 1' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,52%,47%,0.03)] to-[hsl(217,91%,60%,0.03)]" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[hsl(262,52%,47%)] to-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Daily Briefing
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {isLoading ? (
            <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-5/6" /></div>
          ) : (
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive mt-1.5 shrink-0 shadow-sm" />
                <span className="text-foreground/80">{stats.highRisk} project{stats.highRisk !== 1 ? "s" : ""} flagged as Red/Amber RAG requiring immediate attention.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-warning mt-1.5 shrink-0 shadow-sm" />
                <span className="text-foreground/80">{stats.nearingDeadline.length} deadline{stats.nearingDeadline.length !== 1 ? "s" : ""} approaching within the next 30 days.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 shadow-sm" style={{ background: stats.overBudget.length > 0 ? 'hsl(0 84% 60%)' : 'hsl(160 84% 39%)' }} />
                <span className="text-foreground/80">
                  {stats.overBudget.length > 0
                    ? `${stats.overBudget.length} project${stats.overBudget.length !== 1 ? "s" : ""} currently over budget.`
                    : "All projects are within budget. ✅"}
                </span>
              </li>
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Budget Warning */}
      {!isLoading && stats.overBudget.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 shadow-sm">
          <p className="text-sm font-semibold text-warning">⚠️ Budget Warning</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.overBudget.map(p => p.Project_Name__c || p.Name).join(", ")} {stats.overBudget.length === 1 ? "is" : "are"} over budget.
          </p>
        </div>
      )}

      {/* Recent Projects as Cards */}
      <div>
        <h2 className="text-lg font-bold mb-1">Recent Projects</h2>
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Your active portfolio</p>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="rounded-2xl shadow-md"><CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-2 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-lg">No projects yet</p>
              <p className="text-sm text-muted-foreground mt-1">Projects from Salesforce will appear here once connected.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.slice(0, 9).map(project => {
              const progress = project.Percent_Complete__c ?? 0;
              return (
                <Card key={project.Id} className={`rounded-2xl shadow-md card-hover border-l-4 ${ragBorderClass(project.RAG__c)}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{project.Project_Name__c || project.Name}</p>
                        <p className="text-xs text-muted-foreground">{project.Coordinator__c}</p>
                      </div>
                      <Badge variant={project.Status__c === "Active" || project.Status__c === "In Progress" ? "default" : "secondary"} className="text-[10px] rounded-full px-2.5">
                        {project.Status__c}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full" />
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
