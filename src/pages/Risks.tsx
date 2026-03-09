import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Fetch the describe metadata for risks__c and log all field names */
async function fetchRiskDescribe() {
  const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
    body: { endpoint: "/services/data/v57.0/sobjects/risks__c/describe" },
  });
  if (error) throw new Error(error.message);
  const fields = (data?.fields ?? []) as Array<{ name: string; label: string; type: string }>;
  console.log("=== risks__c ALL FIELDS ===");
  fields.forEach((f) => console.log(`  ${f.name} (${f.type}) — "${f.label}"`));
  return fields;
}

/** Fetch risk records using discovered field names */
async function fetchRisks(fieldNames: string[]) {
  const query = `SELECT ${fieldNames.join(",")} FROM risks__c`;
  const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
    body: { endpoint: "/services/data/v62.0/query", params: { q: query } },
  });
  if (error) throw new Error(error.message);
  return data?.records ?? [];
}

/** Map well-known labels to their actual API names from describe */
function resolveFieldMap(fields: Array<{ name: string; label: string; type: string }>) {
  const byLabel: Record<string, string> = {};
  const byName: Record<string, string> = {};
  fields.forEach((f) => {
    byLabel[f.label.toLowerCase()] = f.name;
    byName[f.name.toLowerCase()] = f.name;
  });

  const find = (...candidates: string[]) => {
    for (const c of candidates) {
      const lower = c.toLowerCase();
      if (byName[lower]) return byName[lower];
      if (byLabel[lower]) return byLabel[lower];
    }
    // Fuzzy: check if any field name/label contains the keyword
    for (const c of candidates) {
      const lower = c.toLowerCase();
      const match = fields.find(
        (f) => f.name.toLowerCase().includes(lower) || f.label.toLowerCase().includes(lower)
      );
      if (match) return match.name;
    }
    return null;
  };

  return {
    id: "Id",
    name: find("Name", "Risk_Name__c", "risk name") || "Name",
    project: find("Project__c", "project", "Project_Name__c") || "Project__c",
    probability: find("Probability__c", "probability") || "Probability__c",
    impact: find("Impact__c", "impact") || "Impact__c",
    riskScore: find("Risk_Score__c", "risk score", "score") || "Risk_Score__c",
    owner: find("Owner__c", "Risk_Owner__c", "owner") || "Owner__c",
    deadline: find("Deadline__c", "deadline", "Due_Date__c", "due date") || "Deadline__c",
    mitigation: find("Mitigation_Plan__c", "mitigation", "Mitigation__c") || "Mitigation_Plan__c",
    description: find("Risk_Description__c", "description") || "Risk_Description__c",
  };
}

function scoreBadge(score?: string) {
  const s = (score ?? "").toLowerCase();
  if (s === "critical")
    return <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20">Critical</Badge>;
  if (s === "high")
    return <Badge className="text-[10px] bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/20">High</Badge>;
  if (s === "medium")
    return <Badge className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20">Medium</Badge>;
  return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20">Low</Badge>;
}

export default function Risks() {
  const [fieldMap, setFieldMap] = useState<ReturnType<typeof resolveFieldMap> | null>(null);
  const [describeFields, setDescribeFields] = useState<Array<{ name: string; label: string; type: string }>>([]);

  // Step 1: Describe
  const { data: describeMeta, isLoading: loadingDescribe } = useQuery({
    queryKey: ["salesforce", "risks__c", "describe"],
    queryFn: fetchRiskDescribe,
    staleTime: 600_000,
  });

  // Step 2: Once describe is done, resolve field map
  useEffect(() => {
    if (describeMeta && describeMeta.length > 0) {
      const map = resolveFieldMap(describeMeta);
      setFieldMap(map);
      setDescribeFields(describeMeta);
      console.log("=== Resolved field map ===", map);
    }
  }, [describeMeta]);

  // Step 3: Fetch risks with resolved fields
  const queryFields = fieldMap
    ? [...new Set([fieldMap.id, fieldMap.name, fieldMap.project, fieldMap.probability, fieldMap.impact, fieldMap.riskScore, fieldMap.owner, fieldMap.deadline, fieldMap.mitigation])]
    : [];

  const { data: risks = [], isLoading: loadingRisks } = useQuery({
    queryKey: ["salesforce", "risks__c", "records", queryFields.join(",")],
    queryFn: () => fetchRisks(queryFields),
    enabled: queryFields.length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const [filterScore, setFilterScore] = useState("all");
  const isLoading = loadingDescribe || loadingRisks || !fieldMap;

  const sorted = [...risks].sort((a: any, b: any) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const scoreField = fieldMap?.riskScore || "Risk_Score__c";
    return (order[a[scoreField]] ?? 4) - (order[b[scoreField]] ?? 4);
  });

  const filtered = sorted.filter((r: any) => {
    if (filterScore === "all") return true;
    const scoreField = fieldMap?.riskScore || "Risk_Score__c";
    return r[scoreField] === filterScore;
  });

  const counts = risks.reduce((acc: Record<string, number>, r: any) => {
    const scoreField = fieldMap?.riskScore || "Risk_Score__c";
    const s = r[scoreField] ?? "Low";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const countColors: Record<string, string> = {
    Critical: "bg-destructive/15 text-destructive",
    High: "bg-orange-500/15 text-orange-600",
    Medium: "bg-amber-500/15 text-amber-600",
    Low: "bg-emerald-500/15 text-emerald-600",
  };

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

      {/* Summary counts */}
      <div className="flex gap-2 flex-wrap">
        {["Critical", "High", "Medium", "Low"].map((s) => (
          <span
            key={s}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${countColors[s]}`}
          >
            {s}: {counts[s] ?? 0}
          </span>
        ))}
      </div>

      {/* Debug panel — temporary */}
      {fieldMap && (
        <Card className="border border-dashed border-amber-500/40 bg-amber-500/[0.02]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-medium text-amber-600">Debug: Resolved Field Names (temporary)</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-1">
              <span>Name → {fieldMap.name}</span>
              <span>Project → {fieldMap.project}</span>
              <span>Probability → {fieldMap.probability}</span>
              <span>Impact → {fieldMap.impact}</span>
              <span>Risk Score → {fieldMap.riskScore}</span>
              <span>Owner → {fieldMap.owner}</span>
              <span>Deadline → {fieldMap.deadline}</span>
              <span>Mitigation → {fieldMap.mitigation}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Total fields on object: {describeFields.length}</p>
          </CardContent>
        </Card>
      )}

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
                  <TableHead className="text-[11px]">Risk Name</TableHead>
                  <TableHead className="text-[11px]">Project</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Probability</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Impact</TableHead>
                  <TableHead className="text-[11px]">Risk Score</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Owner</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Deadline</TableHead>
                  <TableHead className="text-[11px] hidden xl:table-cell">Mitigation Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.Id}>
                    <TableCell className="text-xs font-medium">{r[fieldMap!.name]}</TableCell>
                    <TableCell className="text-xs">{r[fieldMap!.project]}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{r[fieldMap!.probability]}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{r[fieldMap!.impact]}</TableCell>
                    <TableCell>{scoreBadge(r[fieldMap!.riskScore])}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{r[fieldMap!.owner]}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{r[fieldMap!.deadline]}</TableCell>
                    <TableCell className="text-xs hidden xl:table-cell max-w-xs truncate">{r[fieldMap!.mitigation]}</TableCell>
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
