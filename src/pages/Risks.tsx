import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const RISK_FIELDS = ["Id", "Name", "Project__c", "Risk_Description__c", "Probability__c", "Impact__c", "Risk_Score__c", "Owner__c", "Deadline__c", "Mitigation_Plan__c", "Risk_ID__c"];

function scoreBadge(score?: string) {
  const s = (score ?? "").toLowerCase();
  if (s === "critical") return <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Critical</Badge>;
  if (s === "high") return <Badge variant="outline" className="text-[10px] text-warning border-warning/30">High</Badge>;
  if (s === "medium") return <Badge variant="outline" className="text-[10px] text-rag-amber border-rag-amber/30">Medium</Badge>;
  return <Badge variant="outline" className="text-[10px]">Low</Badge>;
}

export default function Risks() {
  const { data: risks = [], isLoading } = useSalesforceObject("risks__c", RISK_FIELDS, 120_000);
  const [filterScore, setFilterScore] = useState("all");

  const sorted = [...risks].sort((a: any, b: any) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.Risk_Score__c] ?? 4) - (order[b.Risk_Score__c] ?? 4);
  });

  const filtered = sorted.filter((r: any) => filterScore === "all" || r.Risk_Score__c === filterScore);

  const counts = risks.reduce((acc: Record<string, number>, r: any) => {
    const s = r.Risk_Score__c ?? "Low"; acc[s] = (acc[s] || 0) + 1; return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Risks</h1>
        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["Critical", "High", "Medium", "Low"].map(s => (
          <span key={s} className="text-[11px] text-muted-foreground">{s}: <span className="font-medium text-foreground">{counts[s] ?? 0}</span></span>
        ))}
      </div>

      <Card className="border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              <AlertTriangle className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No risks found</p>
              <p className="text-xs text-muted-foreground mt-0.5">No risks match your filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Risk ID</TableHead>
                  <TableHead className="text-[11px]">Project</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-[11px]">Score</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Owner</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.Id}>
                    <TableCell className="text-xs font-mono">{r.Risk_ID__c || r.Name}</TableCell>
                    <TableCell className="text-xs">{r.Project__c}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell max-w-xs truncate">{r.Risk_Description__c}</TableCell>
                    <TableCell>{scoreBadge(r.Risk_Score__c)}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{r.Owner__c}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{r.Deadline__c}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
