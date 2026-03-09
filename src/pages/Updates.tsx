import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const UPDATE_FIELDS = ["Id", "Name", "Project__c", "Updated_By__c", "Date__c", "Update_Summary__c", "Next_Steps__c", "RAG__c"];

function ragBadge(rag?: string) {
  if (rag === "Red") return <Badge className="bg-destructive text-destructive-foreground text-[10px]">Red</Badge>;
  if (rag === "Amber") return <Badge className="bg-warning text-warning-foreground text-[10px]">Amber</Badge>;
  if (rag === "Green") return <Badge className="bg-success text-success-foreground text-[10px]">Green</Badge>;
  return <Badge variant="secondary" className="text-[10px]">{rag ?? "N/A"}</Badge>;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Updates</h1>
        <Select value={filterRAG} onValueChange={setFilterRAG}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="RAG" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Red">Red</SelectItem>
            <SelectItem value="Amber">Amber</SelectItem>
            <SelectItem value="Green">Green</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((u: any) => (
            <Card key={u.Id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{u.Project__c}</p>
                    <p className="text-xs text-muted-foreground">{u.Date__c} · {u.Updated_By__c}</p>
                  </div>
                  {ragBadge(u.RAG__c)}
                </div>
                <p className="text-sm text-foreground/80 mb-2">{u.Update_Summary__c}</p>
                {u.Next_Steps__c && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Next steps:</span> {u.Next_Steps__c}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
