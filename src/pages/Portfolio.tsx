import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FolderKanban } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { SalesforceProject } from "@/services/salesforce";
import { differenceInDays, parseISO } from "date-fns";

function ragBorderClass(rag?: string) {
  if (rag === "Red") return "border-l-[hsl(0,84%,60%)]";
  if (rag === "Amber") return "border-l-[hsl(38,92%,50%)]";
  if (rag === "Green") return "border-l-[hsl(160,84%,39%)]";
  return "border-l-muted";
}

function ragDotClass(rag?: string) {
  if (rag === "Red") return "bg-rag-red";
  if (rag === "Amber") return "bg-rag-amber";
  if (rag === "Green") return "bg-rag-green";
  return "bg-muted";
}

function budgetPercent(spent?: number, budget?: number) {
  if (!budget || budget === 0) return 0;
  return Math.min(Math.round(((spent ?? 0) / budget) * 100), 100);
}

export default function Portfolio() {
  const { data: projects = [], isLoading } = useProjects();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRAG, setFilterRAG] = useState("all");
  const [selected, setSelected] = useState<SalesforceProject | null>(null);

  const filtered = projects.filter(p => {
    if (filterStatus !== "all" && p.Status__c !== filterStatus) return false;
    if (filterRAG !== "all" && p.RAG__c !== filterRAG) return false;
    return true;
  });

  const statuses = [...new Set(projects.map(p => p.Status__c).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Portfolio</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">All projects overview</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRAG} onValueChange={setFilterRAG}>
            <SelectTrigger className="w-36 h-9 text-sm rounded-xl"><SelectValue placeholder="RAG" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RAG</SelectItem>
              <SelectItem value="Green">Green</SelectItem>
              <SelectItem value="Amber">Amber</SelectItem>
              <SelectItem value="Red">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-md"><CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">No projects found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => {
            const daysLeft = project.Deadline__c ? differenceInDays(parseISO(project.Deadline__c), new Date()) : null;
            const spent = budgetPercent(project.Spent_EUR__c, project.Budget_EUR__c);
            const progress = project.Percent_Complete__c ?? 0;
            return (
              <Card key={project.Id} className={`rounded-2xl shadow-md card-hover cursor-pointer border-l-4 ${ragBorderClass(project.RAG__c)}`} onClick={() => setSelected(project)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{project.Project_Name__c || project.Name}</p>
                      <p className="text-xs text-muted-foreground">{project.Coordinator__c}</p>
                    </div>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${ragDotClass(project.RAG__c)}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] rounded-full">{project.Status__c}</Badge>
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-medium ${daysLeft < 0 ? "text-destructive" : daysLeft < 14 ? "text-warning" : "text-muted-foreground"}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progress</span><span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 rounded-full" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Budget</span><span className="font-semibold">{spent}% spent</span>
                    </div>
                    <Progress value={spent} className="h-2 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.Project_Name__c || selected.Name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground text-xs">Project ID</p><p className="font-medium">{selected.Project_ID__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge className="rounded-full text-[10px] mt-1">{selected.Status__c}</Badge></div>
                  <div><p className="text-muted-foreground text-xs">RAG</p><div className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${ragDotClass(selected.RAG__c)}`} /><span className="font-medium">{selected.RAG__c}</span></div></div>
                  <div><p className="text-muted-foreground text-xs">Coordinator</p><p className="font-medium">{selected.Coordinator__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Budget (EUR)</p><p className="font-medium">€{selected.Budget_EUR__c?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Spent (EUR)</p><p className="font-medium">€{selected.Spent_EUR__c?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Start Date</p><p className="font-medium">{selected.Start_Date__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Deadline</p><p className="font-medium">{selected.Deadline__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Completion</p><p className="font-medium">{Math.round(selected.Percent_Complete__c ?? 0)}%</p></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
