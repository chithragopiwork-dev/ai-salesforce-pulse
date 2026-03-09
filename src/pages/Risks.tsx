import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// ─── Salesforce credentials ───────────────────────────────────────────────────
// These should match what you used in the rest of your app
const SF_INSTANCE_URL = import.meta.env.VITE_SF_INSTANCE_URL || "";
const SF_ACCESS_TOKEN  = import.meta.env.VITE_SF_ACCESS_TOKEN  || "";

// ─── Direct Salesforce fetch helpers ─────────────────────────────────────────
async function sfGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${SF_INSTANCE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${SF_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Salesforce error ${res.status}: ${err}`);
  }
  return res.json();
}

async function fetchRiskDescribe() {
  const data = await sfGet("/services/data/v57.0/sobjects/risks__c/describe");
  const fields = (data?.fields ?? []) as Array<{ name: string; label: string; type: string }>;
  console.log("=== risks__c ALL FIELDS ===");
  fields.forEach((f) => console.log(`  ${f.name} (${f.type}) — "${f.label}"`));
  return fields;
}

async function fetchRisks(fieldNames: string[]) {
  const q = `SELECT ${fieldNames.join(",")} FROM risks__c LIMIT 200`;
  const data = await sfGet("/services/data/v57.0/query", { q });
  return data?.records ?? [];
}

// ─── Field resolver ───────────────────────────────────────────────────────────
function resolveFieldMap(fields: Array<{ name: string; label: string; type: string }>) {
  const byLabel: Record<string, string> = {};
  const byName:  Record<string, string> = {};
  fields.forEach((f) => {
    byLabel[f.label.toLowerCase()] = f.name;
    byName[f.name.toLowerCase()]   = f.name;
  });

  const find = (...candidates: string[]) => {
    for (const c of candidates) {
      const lower = c.toLowerCase();
      if (byName[lower])  return byName[lower];
      if (byLabel[lower]) return byLabel[lower];
    }
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
    id:          "Id",
    name:        find("Name", "Risk_Name__c", "risk name")                          || "Name",
    project:     find("Project__c", "project", "Project_Name__c")                   || "Project__c",
    probability: find("Probability__c", "probability")                               || "Probability__c",
    impact:      find("Impact__c", "impact")                                         || "Impact__c",
    riskScore:   find("Risk_Score__c", "risk score", "score", "riskscore")           || "Risk_Score__c",
    owner:       find("Owner__c", "Risk_Owner__c", "owner")                          || "Owner__c",
    deadline:    find("Deadline__c", "deadline", "Due_Date__c", "due date")          || "Deadline__c",
    mitigation:  find("Mitigation_Plan__c", "mitigation", "Mitigation__c")          || "Mitigation_Plan__c",
  };
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function scoreBadge(score?: string) {
  const s = (score ?? "").toLowerCase();
  if (s === "critical")
    return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300">Critical</Badge>;
  if (s === "high")
    return <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">High</Badge>;
  if (s === "medium")
    return <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">Medium</Badge>;
  return <Badge className="text-[10px] bg-green-100 text-green-700 border-green-300">Low</Badge>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Risks() {
  const [fieldMap, setFieldMap] = useState<ReturnType<typeof resolveFieldMap> | null>(null);

  const { data: describeMeta, isLoading: loadingDescribe, error: describeError } = useQuery({
    queryKey: ["sf", "risks__c", "describe"],
    queryFn:  fetchRiskDescribe,
    staleTime: 600_000,
  });

  useEffect(() => {
    if (describeMeta?.length) {
      const map = resolveFieldMap(describeMeta);
      setFieldMap(map);
      console.log("=== Resolved field map ===", map);
    }
  }, [describeMeta]);

  const queryFields = fieldMap
    ? [...new Set([fieldMap.id, fieldMap.name, fieldMap.project, fieldMap.probability,
                   fieldMap.impact, fieldMap.riskScore, fieldMap.owner, fieldMap.deadline,
                   fieldMap.mitigation])]
    : [];

  const { data: risks = [], isLoading: loadingRisks, error: risksError } = useQuery({
    queryKey: ["sf", "risks__c", "records", queryFields.join(",")],
    queryFn:  () => fetchRisks(queryFields),
    enabled:  queryFields.length > 0,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const [filterScore, setFilterScore] = useState("all");
  const isLoading = loadingDescribe || loadingRisks || !fieldMap;
  const error = describeError || risksError;

  const sorted = [...risks].sort((a: any, b: any) => {
    const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a[fieldMap?.riskScore ?? "Risk_Score__c"]] ?? 4) -
           (order[b[fieldMap?.riskScore ?? "Risk_Score__c"]] ?? 4);
  });

  const filtered = sorted.filter((r: any) => {
    if (filterScore === "all") return true;
    return r[fieldMap?.riskScore ?? "Risk_Score__c"] === filterScore;
  });

  const counts = risks.reduce((acc: Record<string, number>, r: any) => {
    const s = r[fieldMap?.riskScore ?? "Risk_Score__c"] ?? "Low";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const countColors: Record<string, string> = {
    Critical: "bg-red-100 text-red-700",
    High:     "bg-orange-100 text-orange-700",
    Medium:   "bg-amber-100 text-amber-700",
    Low:      "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Risks</h1>
        <Select value={filterScore} onValueChange={setFilterScore}>
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue placeholder="Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
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
          <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${countColors[s]}`}>
            {s}: {counts[s] ?? 0}
          </span>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            ⚠️ Salesforce connection error: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              <AlertTriangle className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No risks found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {risks.length === 0 ? "No data returned from Salesforce." : "No risks match your filter."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Risk Name</TableHead>
                  <TableHead className="text-[11px]">Project</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Probability</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Impact</TableHead>
                  <TableHead className="text-[11px]">Score</TableHead>
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
                    <TableCell className="text-xs hidden md:table-cell">
                      {r[fieldMap!.deadline] ? new Date(r[fieldMap!.deadline]).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                    <TableCell className="text-xs hidden xl:table-cell max-w-xs truncate">
                      {r[fieldMap!.mitigation]}
                    </TableCell>
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
