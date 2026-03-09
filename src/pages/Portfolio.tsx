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

function ragBorder(rag?: string) {
  if (rag === "Red") return "border-l-rag-red";
  if (rag === "Amber") return "border-l-rag-amber";
  if (rag === "Green") return "border-l-rag-green";
  return "border-l-border";
}

function ragDot(rag?: string) {
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
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s!}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRAG} onValueChange={setFilterRAG}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="RAG" /></SelectTrigger>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border"><CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-2 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border">
          <CardContent className="p-10 flex flex-col items-center text-center">
            <FolderKanban className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(project => {
            const daysLeft = project.Deadline__c ? differenceInDays(parseISO(project.Deadline__c), new Date()) : null;
            const spent = budgetPercent(project.Spent_EUR__c, project.Budget_EUR__c);
            const progress = project.Percent_Complete__c ?? 0;
            return (
              <Card key={project.Id} className={`border border-l-2 ${ragBorder(project.RAG__c)} cursor-pointer hover:bg-secondary/30 transition-colors`} onClick={() => setSelected(project)}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{project.Project_Name__c || project.Name}</p>
                      <p className="text-[11px] text-muted-foreground">{project.Coordinator__c}</p>
                    </div>
                    <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${ragDot(project.RAG__c)}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{project.Status__c}</Badge>
                    {daysLeft !== null && (
                      <span className={`text-[10px] ${daysLeft < 0 ? "text-destructive" : daysLeft < 14 ? "text-warning" : "text-muted-foreground"}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progress</span><span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Budget</span><span>{spent}% spent</span>
                    </div>
                    <Progress value={spent} className="h-1.5" />
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
                <SheetTitle className="text-base">{selected.Project_Name__c || selected.Name}</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground text-[11px]">Project ID</p><p className="text-[13px] font-medium">{selected.Project_ID__c}</p></div>
                  <div><p className="text-muted-foreground text-[11px]">Status</p><Badge className="text-[10px] mt-0.5">{selected.Status__c}</Badge></div>
                  <div><p className="text-muted-foreground text-[11px]">RAG</p><div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${ragDot(selected.RAG__c)}`} /><span className="text-[13px]">{selected.RAG__c}</span></div></div>
                  <div><p className="text-muted-foreground text-[11px]">Coordinator</p><p className="text-[13px]">{selected.Coordinator__c}</p></div>
                  <div><p className="text-muted-foreground text-[11px]">Budget</p><p className="text-[13px]">€{selected.Budget_EUR__c?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-[11px]">Spent</p><p className="text-[13px]">€{selected.Spent_EUR__c?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-[11px]">Start</p><p className="text-[13px]">{selected.Start_Date__c}</p></div>
                  <div><p className="text-muted-foreground text-[11px]">Deadline</p><p className="text-[13px]">{selected.Deadline__c}</p></div>
                  <div><p className="text-muted-foreground text-[11px]">Complete</p><p className="text-[13px]">{Math.round(selected.Percent_Complete__c ?? 0)}%</p></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
