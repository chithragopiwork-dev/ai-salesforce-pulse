import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const RISK_FIELDS = ["Id", "Name", "Project__c", "Description__c", "Probability__c", "Impact__c", "Score__c", "Owner__c", "Deadline__c", "Mitigation__c"];

function scoreBadge(score?: string) {
  const s = (score ?? "").toLowerCase();
  if (s === "critical") return <Badge className="bg-destructive text-destructive-foreground text-[10px]">Critical</Badge>;
  if (s === "high") return <Badge className="bg-warning text-warning-foreground text-[10px]">High</Badge>;
  if (s === "medium") return <Badge className="bg-rag-amber text-warning-foreground text-[10px]">Medium</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
}

export default function Risks() {
  const { data: risks = [], isLoading } = useSalesforceObject("risks__c", RISK_FIELDS, 120_000);
  const [filterScore, setFilterScore] = useState("all");

  const sorted = [...risks].sort((a: any, b: any) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a.Score__c] ?? 4) - (order[b.Score__c] ?? 4);
  });

  const filtered = sorted.filter((r: any) => filterScore === "all" || r.Score__c === filterScore);

  const counts = risks.reduce((acc: Record<string, number>, r: any) => {
    const s = r.Score__c ?? "Low";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Risks</h1>
        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {["Critical", "High", "Medium", "Low"].map(s => (
          <Badge key={s} variant="outline" className="text-xs gap-1.5">
            {s}: <span className="font-bold">{counts[s] ?? 0}</span>
          </Badge>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden md:table-cell">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.Id}>
                    <TableCell className="text-sm font-mono">{r.Name}</TableCell>
                    <TableCell className="text-sm">{r.Project__c}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell max-w-xs truncate">{r.Description__c}</TableCell>
                    <TableCell>{scoreBadge(r.Score__c)}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.Owner__c}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{r.Deadline__c}</TableCell>
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
