import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const UPDATE_FIELDS = ["Id", "Name", "Project__c", "Updated_By__c", "Date__c", "Update_Summary__c", "Next_Steps__c", "RAG__c"];

function ragBadge(rag?: string) {
  if (rag === "Red") return <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Red</Badge>;
  if (rag === "Amber") return <Badge variant="outline" className="text-[10px] text-warning border-warning/30">Amber</Badge>;
  if (rag === "Green") return <Badge variant="outline" className="text-[10px] text-success border-success/30">Green</Badge>;
  return <Badge variant="outline" className="text-[10px]">{rag ?? "N/A"}</Badge>;
}

export default function Updates() {
  const { data: updates = [], isLoading } = useSalesforceObject("project_updates__c", UPDATE_FIELDS, 600_000);
  const [filterRAG, setFilterRAG] = useState("all");

  const sorted = [...updates].sort((a: any, b: any) => {
    if (!a.Date__c || !b.Date__c) return 0;
    return b.Date__c.localeCompare(a.Date__c);
  });

  const filtered = sorted.filter((u: any) => filterRAG === "all" || u.RAG__c === filterRAG);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Updates</h1>
        <Select value={filterRAG} onValueChange={setFilterRAG}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="RAG" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Red">Red</SelectItem>
            <SelectItem value="Amber">Amber</SelectItem>
            <SelectItem value="Green">Green</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((u: any) => (
            <Card key={u.Id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[13px] font-medium">{u.Project__c}</p>
                    <p className="text-[11px] text-muted-foreground">{u.Date__c} · {u.Updated_By__c}</p>
                  </div>
                  {ragBadge(u.RAG__c)}
                </div>
                <p className="text-xs text-muted-foreground">{u.Update_Summary__c}</p>
                {u.Next_Steps__c && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    <span className="font-medium text-foreground">Next:</span> {u.Next_Steps__c}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
