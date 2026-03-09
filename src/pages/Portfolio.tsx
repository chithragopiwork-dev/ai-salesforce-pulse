import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProjects } from "@/hooks/useProjects";
import { SalesforceProject } from "@/services/salesforce";
import { differenceInDays, parseISO } from "date-fns";

function ragColor(health?: string) {
  if (health === "At Risk" || health === "Delayed") return "bg-rag-red";
  if (health === "Healthy") return "bg-rag-green";
  return "bg-rag-amber";
}

function ragDot(health?: string) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ragColor(health)}`} />;
}

function budgetPercent(actual?: number, budget?: number) {
  if (!budget || budget === 0) return 0;
  return Math.min(Math.round(((actual ?? 0) / budget) * 100), 100);
}

export default function Portfolio() {
  const { data: projects = [], isLoading } = useProjects();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRAG, setFilterRAG] = useState("all");
  const [selected, setSelected] = useState<SalesforceProject | null>(null);

  const filtered = projects.filter(p => {
    if (filterStatus !== "all" && p.Status__c !== filterStatus) return false;
    if (filterRAG !== "all" && p.Health_Status__c !== filterRAG) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRAG} onValueChange={setFilterRAG}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="RAG" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RAG</SelectItem>
              <SelectItem value="Healthy">Green</SelectItem>
              <SelectItem value="At Risk">Amber</SelectItem>
              <SelectItem value="Delayed">Red</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-sm"><CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => {
            const daysLeft = project.End_Date__c ? differenceInDays(parseISO(project.End_Date__c), new Date()) : null;
            const spent = budgetPercent(project.Actual_Cost__c, project.Budget__c);
            return (
              <Card
                key={project.Id}
                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected(project)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{project.Name}</p>
                      <p className="text-xs text-muted-foreground">{project.Project_Manager__c}</p>
                    </div>
                    {ragDot(project.Health_Status__c)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{project.Status__c}</Badge>
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-medium ${daysLeft < 0 ? "text-destructive" : daysLeft < 14 ? "text-warning" : "text-muted-foreground"}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Budget</span>
                      <span>{spent}% spent</span>
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
                <SheetTitle>{selected.Name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground text-xs">Status</p><p className="font-medium">{selected.Status__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Priority</p><p className="font-medium">{selected.Priority__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Coordinator</p><p className="font-medium">{selected.Project_Manager__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Health</p><p className="font-medium">{selected.Health_Status__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">Budget</p><p className="font-medium">£{selected.Budget__c?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Actual Cost</p><p className="font-medium">£{selected.Actual_Cost__c?.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Start Date</p><p className="font-medium">{selected.Start_Date__c}</p></div>
                  <div><p className="text-muted-foreground text-xs">End Date</p><p className="font-medium">{selected.End_Date__c}</p></div>
                </div>
                {selected.Description__c && (
                  <div><p className="text-muted-foreground text-xs mb-1">Description</p><p>{selected.Description__c}</p></div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
