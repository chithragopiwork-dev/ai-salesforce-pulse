import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/useProjects";
import { useSalesforceObject } from "@/hooks/useSalesforceData";
import { Sparkles, TrendingUp, Bug } from "lucide-react";
import { differenceInDays, parseISO, addMonths, format } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";

/** Convert decimal (0.72) to percentage (72). Values > 1 assumed already percentage. */
function toPercent(v?: number | null): number {
  if (v == null) return 0;
  return v <= 1 ? v * 100 : v;
}

interface ProjectForecast {
  id: string; name: string; rag: string; percentComplete: number;
  daysElapsed: number; daysTotal: number; daysRemaining: number;
  predictedOnTime: "early" | "on-time" | "late" | "overdue";
  predictedCompletionDays: number;
  budget: number; spent: number; predictedFinalCost: number; overUnder: number;
  healthScore: number; riskCount: number;
  // debug
  rawPct: number; deadlineStr: string; startStr: string;
}

function computeForecasts(projects: any[], risks: any[]): ProjectForecast[] {
  const today = new Date();
  const risksByProject = risks.reduce((acc: Record<string, number>, r: any) => {
    const p = r.Project__c || "unknown"; acc[p] = (acc[p] || 0) + 1; return acc;
  }, {});

  return projects.map((p) => {
    const startStr = p.Start_Date__c || "";
    const deadlineStr = p.Deadline__c || "";
    const start = startStr ? parseISO(startStr) : today;
    const deadline = deadlineStr ? parseISO(deadlineStr) : addMonths(today, 3);
    const daysTotal = Math.max(differenceInDays(deadline, start), 1);
    const daysElapsed = Math.max(differenceInDays(today, start), 1);
    const daysRemaining = differenceInDays(deadline, today); // can be negative = overdue

    const rawPct = p.Percent_Complete__c ?? 0;
    const pct = toPercent(rawPct); // now 0-100

    // Velocity: % per day
    const velocity = pct / daysElapsed;
    const predictedCompletionDays = velocity > 0 ? Math.round(100 / velocity) : daysTotal * 2;

    let predictedOnTime: "early" | "on-time" | "late" | "overdue";
    if (daysRemaining < 0 && pct < 100) {
      predictedOnTime = "overdue";
    } else if (predictedCompletionDays < daysTotal * 0.95) {
      predictedOnTime = "early";
    } else if (predictedCompletionDays <= daysTotal * 1.05) {
      predictedOnTime = "on-time";
    } else {
      predictedOnTime = "late";
    }

    const budget = p.Budget_EUR__c ?? 0;
    const spent = p.Spent_EUR__c ?? 0;
    // Budget forecast: if pct > 0, predicted = (spent / pct) * 100
    const predictedFinalCost = pct > 0 ? Math.round((spent / pct) * 100) : (budget > 0 ? budget : 0);
    const overUnder = predictedFinalCost - budget;
    const riskCount = risksByProject[p.Id] ?? risksByProject[p.Project_Name__c] ?? 0;

    let ragScore = p.RAG__c === "Green" ? 30 : p.RAG__c === "Amber" ? 15 : 0;
    let budgetScore = budget > 0 ? Math.max(0, 25 - Math.max(0, (overUnder / budget) * 25)) : 25;
    let timelineScore = predictedOnTime === "early" ? 25 : predictedOnTime === "on-time" ? 20 :
      predictedOnTime === "overdue" ? 0 : Math.max(0, 25 - (predictedCompletionDays - daysTotal) / daysTotal * 25);
    let riskScore = Math.max(0, 20 - riskCount * 5);
    const healthScore = Math.round(Math.min(100, ragScore + budgetScore + timelineScore + riskScore));

    return { id: p.Id, name: p.Project_Name__c || p.Name, rag: p.RAG__c || "Unknown",
      percentComplete: pct, daysElapsed, daysTotal, daysRemaining, predictedOnTime, predictedCompletionDays,
      budget, spent, predictedFinalCost, overUnder, healthScore, riskCount,
      rawPct, deadlineStr, startStr };
  });
}

function HealthGauge({ score, size = 64 }: { score: number; size?: number }) {
  const color = score >= 70 ? "hsl(152, 56%, 42%)" : score >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(220 13% 91%)" strokeWidth="6" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${score * 2.51} 251`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold">{score}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "early" | "on-time" | "late" | "overdue" }) {
  const styles: Record<string, string> = {
    early: "bg-success/10 text-success border-success/20",
    "on-time": "bg-warning/10 text-warning border-warning/20",
    late: "bg-destructive/10 text-destructive border-destructive/20",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const labels: Record<string, string> = { early: "Early", "on-time": "On Time", late: "Late", overdue: "Overdue" };
  return <Badge variant="outline" className={`text-[10px] ${styles[status]}`}>{labels[status]}</Badge>;
}

export default function Forecasting() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: risks = [], isLoading: loadingRisks } = useSalesforceObject("risks__c", ["Id", "Project__c", "Risk_Score__c"], 120_000);
  const isLoading = loadingProjects || loadingRisks;

  const forecasts = useMemo(() => computeForecasts(projects, risks), [projects, risks]);
  const portfolioHealth = forecasts.length > 0 ? Math.round(forecasts.reduce((s, f) => s + f.healthScore, 0) / forecasts.length) : 0;
  const lateProjects = forecasts.filter(f => f.predictedOnTime === "late" || f.predictedOnTime === "overdue");
  const overBudgetProjects = forecasts.filter(f => f.overUnder > 0);

  const summaryBullets = useMemo(() => {
    const bullets: { text: string; color: string }[] = [];
    if (lateProjects.length > 0) bullets.push({ text: `${lateProjects.length} project${lateProjects.length > 1 ? "s" : ""} predicted late or overdue`, color: "bg-destructive" });
    const biggest = [...overBudgetProjects].sort((a, b) => b.overUnder - a.overUnder)[0];
    if (biggest) bullets.push({ text: `${biggest.name} is the biggest budget risk (€${biggest.overUnder.toLocaleString()} over)`, color: "bg-warning" });
    if (forecasts.length > 0 && lateProjects.length === 0 && overBudgetProjects.length === 0) bullets.push({ text: "All projects on track — portfolio healthy", color: "bg-success" });
    if (bullets.length < 3) bullets.push({ text: `Portfolio health: ${portfolioHealth}/100`, color: portfolioHealth >= 70 ? "bg-success" : "bg-warning" });
    return bullets.slice(0, 3);
  }, [forecasts, lateProjects, overBudgetProjects, portfolioHealth]);

  const budgetChartData = forecasts.map(f => ({
    name: f.name.length > 12 ? f.name.substring(0, 12) + "…" : f.name,
    budget: f.budget, predicted: f.predictedFinalCost,
    fill: f.overUnder > 0 ? "hsl(0, 72%, 51%)" : "hsl(152, 56%, 42%)",
  }));

  const next6Months = Array.from({ length: 6 }, (_, i) => ({ label: format(addMonths(new Date(), i), "MMM yy"), month: i }));
  const heatmapData = forecasts.map(f => ({
    name: f.name.length > 10 ? f.name.substring(0, 10) + "…" : f.name,
    cells: next6Months.map((_, idx) => {
      const m = f.daysRemaining / 30 - idx;
      if (m < -1) return "done";
      if (f.predictedOnTime === "overdue" || (f.predictedOnTime === "late" && m < 2)) return "high";
      if (f.rag === "Amber" || (f.predictedOnTime === "late" && m < 4)) return "medium";
      return "low";
    }),
  }));

  if (isLoading) return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-semibold">Forecasting</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Card key={i} className="border"><CardContent className="p-4"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
      </div>
    </div>
  );

  if (forecasts.length === 0) return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-semibold">Forecasting</h1>
      <Card className="border">
        <CardContent className="p-10 flex flex-col items-center text-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">No forecast data</p>
          <p className="text-xs text-muted-foreground mt-0.5">Forecasts appear once projects are loaded.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-xl font-semibold">Forecasting</h1>

      {/* Debug Panel */}
      <Card className="border border-dashed border-warning/40 bg-warning/[0.02]">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="h-3.5 w-3.5 text-warning" />
            <span className="text-[11px] font-medium text-warning">Debug: Field Names & Values (temporary)</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground space-y-1">
            <p>Fields used: Percent_Complete__c (decimal, ×100), Deadline__c (date), Start_Date__c (date), Budget_EUR__c (double), Spent_EUR__c (double)</p>
            {forecasts.slice(0, 3).map(f => (
              <p key={f.id}>
                {f.name}: rawPct={f.rawPct} → {Math.round(f.percentComplete)}% | deadline={f.deadlineStr} | daysLeft={f.daysRemaining} | budget=€{f.budget.toLocaleString()} | spent=€{f.spent.toLocaleString()} | predicted=€{f.predictedFinalCost.toLocaleString()}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card className="border border-primary/15 bg-primary/[0.02]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">AI Forecast Summary</span>
          </div>
          <ul className="space-y-2 text-[13px] text-muted-foreground">
            {summaryBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${b.color} mt-1.5 shrink-0`} />
                {b.text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Portfolio Health */}
      <Card className="border">
        <CardContent className="p-4 flex items-center gap-5">
          <HealthGauge score={portfolioHealth} size={72} />
          <div>
            <p className="text-[11px] text-muted-foreground">Portfolio Health</p>
            <p className="text-lg font-semibold">{portfolioHealth >= 70 ? "Healthy" : portfolioHealth >= 40 ? "Needs Attention" : "Critical"}</p>
            <p className="text-[11px] text-muted-foreground">{forecasts.length} projects</p>
          </div>
        </CardContent>
      </Card>

      {/* Deadline Forecast */}
      <div>
        <h2 className="text-sm font-medium mb-3">Deadline Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {forecasts.map(f => (
            <Card key={f.id} className="border">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <p className="text-[13px] font-medium">{f.name}</p>
                  <StatusBadge status={f.predictedOnTime} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Days left</span>
                    <p className={`font-semibold text-base ${f.daysRemaining < 0 ? "text-destructive" : ""}`}>
                      {f.daysRemaining < 0 ? `${Math.abs(f.daysRemaining)}d overdue` : f.daysRemaining}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Complete</span>
                    <p className="font-semibold text-base">{Math.round(f.percentComplete)}%</p>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
                  <div className="h-full bg-muted-foreground/20 rounded-full absolute" style={{ width: `${Math.min(100, (f.daysElapsed / f.daysTotal) * 100)}%` }} />
                  <div className="h-full rounded-full absolute" style={{
                    width: `${Math.min(100, f.percentComplete)}%`,
                    background: f.predictedOnTime === "overdue" || f.predictedOnTime === "late" ? "hsl(0, 72%, 51%)" : f.predictedOnTime === "early" ? "hsl(152, 56%, 42%)" : "hsl(38, 92%, 50%)",
                  }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Budget Burn */}
      <div>
        <h2 className="text-sm font-medium mb-3">Budget Forecast</h2>
        {budgetChartData.length > 0 && (
          <Card className="border mb-3">
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={budgetChartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Bar dataKey="budget" fill="hsl(220, 65%, 54%)" radius={[3, 3, 0, 0]} name="Budget" />
                  <Bar dataKey="predicted" radius={[3, 3, 0, 0]} name="Predicted">
                    {budgetChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {forecasts.map(f => (
            <Card key={f.id} className="border">
              <CardContent className="p-4 space-y-1.5">
                <p className="text-[13px] font-medium">{f.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <span className="text-muted-foreground">Budget</span><span className="text-right">€{f.budget.toLocaleString()}</span>
                  <span className="text-muted-foreground">Spent</span><span className="text-right">€{f.spent.toLocaleString()}</span>
                  <span className="text-muted-foreground">Predicted</span><span className="text-right">€{f.predictedFinalCost.toLocaleString()}</span>
                  <span className="text-muted-foreground">Over/Under</span>
                  <span className={`text-right font-medium ${f.overUnder > 0 ? "text-destructive" : "text-success"}`}>
                    {f.overUnder > 0 ? "+" : ""}€{f.overUnder.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Health Scores */}
      <div>
        <h2 className="text-sm font-medium mb-3">Project Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {forecasts.map(f => (
            <Card key={f.id} className="border">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <HealthGauge score={f.healthScore} />
                <p className="text-xs text-center font-medium">{f.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Risk Heatmap */}
      <div>
        <h2 className="text-sm font-medium mb-3">Risk Heatmap</h2>
        <Card className="border overflow-x-auto">
          <CardContent className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Project</th>
                  {next6Months.map(m => <th key={m.label} className="text-center font-medium text-muted-foreground pb-2 px-2">{m.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-4 font-medium">{row.name}</td>
                    {row.cells.map((cell, j) => (
                      <td key={j} className="py-1 px-2 text-center">
                        <div className={`h-5 w-full rounded ${
                          cell === "high" ? "bg-destructive/20" : cell === "medium" ? "bg-warning/20" : cell === "done" ? "bg-secondary" : "bg-success/15"
                        }`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-success/15" /> Low</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-warning/20" /> Medium</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-destructive/20" /> High</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-secondary" /> Done</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
