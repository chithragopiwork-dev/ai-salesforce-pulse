import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useProjects } from "@/hooks/useProjects";
import { useSalesforceObject } from "@/hooks/useSalesforceData";
import { Sparkles, TrendingUp, DollarSign, Users, Activity, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO, addMonths, format } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  RadialBarChart, RadialBar, Legend,
} from "recharts";

interface ProjectForecast {
  id: string;
  name: string;
  rag: string;
  percentComplete: number;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  predictedOnTime: "early" | "on-time" | "late";
  predictedCompletionDays: number;
  budget: number;
  spent: number;
  burnRate: number;
  predictedFinalCost: number;
  overUnder: number;
  healthScore: number;
  riskCount: number;
}

function computeForecasts(projects: any[], risks: any[]): ProjectForecast[] {
  const today = new Date();
  const risksByProject = risks.reduce((acc: Record<string, number>, r: any) => {
    const p = r.Project__c || "unknown";
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  return projects.map((p) => {
    const start = p.Start_Date__c ? parseISO(p.Start_Date__c) : today;
    const deadline = p.Deadline__c ? parseISO(p.Deadline__c) : addMonths(today, 3);
    const daysTotal = Math.max(differenceInDays(deadline, start), 1);
    const daysElapsed = Math.max(differenceInDays(today, start), 1);
    const daysRemaining = Math.max(differenceInDays(deadline, today), 0);
    const pct = p.Percent_Complete__c ?? 0;
    const velocity = pct / daysElapsed;
    const predictedCompletionDays = velocity > 0 ? Math.round(100 / velocity) : daysTotal * 2;
    const predictedOnTime: "early" | "on-time" | "late" =
      predictedCompletionDays < daysTotal * 0.95 ? "early" :
      predictedCompletionDays <= daysTotal * 1.05 ? "on-time" : "late";

    const budget = p.Budget_EUR__c ?? 0;
    const spent = p.Spent_EUR__c ?? 0;
    const burnRate = daysElapsed > 0 ? spent / daysElapsed : 0;
    const predictedFinalCost = Math.round(burnRate * daysTotal);
    const overUnder = predictedFinalCost - budget;

    const riskCount = risksByProject[p.Id] ?? risksByProject[p.Project_Name__c] ?? 0;

    // Health score: RAG(30) + Budget(25) + Timeline(25) + Risks(20)
    let ragScore = p.RAG__c === "Green" ? 30 : p.RAG__c === "Amber" ? 15 : 0;
    let budgetScore = budget > 0 ? Math.max(0, 25 - Math.max(0, (overUnder / budget) * 25)) : 25;
    let timelineScore = predictedOnTime === "early" ? 25 : predictedOnTime === "on-time" ? 20 : Math.max(0, 25 - (predictedCompletionDays - daysTotal) / daysTotal * 25);
    let riskScore = Math.max(0, 20 - riskCount * 5);
    const healthScore = Math.round(Math.min(100, ragScore + budgetScore + timelineScore + riskScore));

    return {
      id: p.Id,
      name: p.Project_Name__c || p.Name,
      rag: p.RAG__c || "Unknown",
      percentComplete: pct,
      daysElapsed,
      daysTotal,
      daysRemaining,
      predictedOnTime,
      predictedCompletionDays,
      budget,
      spent,
      burnRate,
      predictedFinalCost,
      overUnder,
      healthScore,
      riskCount,
    };
  });
}

function HealthGauge({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 70 ? "hsl(160, 84%, 39%)" : score >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(225 13% 90%)" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${score * 2.51} 251`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-extrabold">{score}</span>
      </div>
    </div>
  );
}

function StatusLight({ status }: { status: "early" | "on-time" | "late" }) {
  const c = status === "early" ? "bg-success" : status === "on-time" ? "bg-warning" : "bg-destructive";
  const label = status === "early" ? "Early" : status === "on-time" ? "On Time" : "Late";
  return (
    <Badge className={`${c} text-white rounded-full text-[10px] font-semibold px-2.5`}>{label}</Badge>
  );
}

export default function Forecasting() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: risks = [], isLoading: loadingRisks } = useSalesforceObject("risks__c", ["Id", "Project__c", "Risk_Score__c"], 120_000);
  const isLoading = loadingProjects || loadingRisks;

  const forecasts = useMemo(() => computeForecasts(projects, risks), [projects, risks]);

  const portfolioHealth = forecasts.length > 0
    ? Math.round(forecasts.reduce((s, f) => s + f.healthScore, 0) / forecasts.length)
    : 0;

  const lateProjects = forecasts.filter(f => f.predictedOnTime === "late");
  const overBudgetProjects = forecasts.filter(f => f.overUnder > 0);

  // AI Summary bullets
  const summaryBullets = useMemo(() => {
    const bullets: { text: string; color: string }[] = [];
    if (lateProjects.length > 0) {
      bullets.push({ text: `${lateProjects.length} project${lateProjects.length > 1 ? "s" : ""} predicted to miss deadline`, color: "bg-destructive" });
    }
    const biggestOverBudget = overBudgetProjects.sort((a, b) => b.overUnder - a.overUnder)[0];
    if (biggestOverBudget) {
      bullets.push({ text: `${biggestOverBudget.name} is the biggest budget risk (€${biggestOverBudget.overUnder.toLocaleString()} over)`, color: "bg-warning" });
    }
    if (forecasts.length > 0 && lateProjects.length === 0 && overBudgetProjects.length === 0) {
      bullets.push({ text: "All projects on track — portfolio looking healthy ✅", color: "bg-success" });
    }
    if (bullets.length < 3) {
      bullets.push({ text: `Portfolio health score: ${portfolioHealth}/100`, color: portfolioHealth >= 70 ? "bg-success" : "bg-warning" });
    }
    return bullets.slice(0, 3);
  }, [forecasts, lateProjects, overBudgetProjects, portfolioHealth]);

  // Budget chart data
  const budgetChartData = forecasts.map(f => ({
    name: f.name.length > 15 ? f.name.substring(0, 15) + "…" : f.name,
    budget: f.budget,
    predicted: f.predictedFinalCost,
    fill: f.overUnder > 0 ? "hsl(0, 84%, 60%)" : "hsl(160, 84%, 39%)",
  }));

  // Risk heatmap: next 6 months
  const next6Months = Array.from({ length: 6 }, (_, i) => {
    const d = addMonths(new Date(), i);
    return { label: format(d, "MMM yyyy"), month: i };
  });

  const heatmapData = forecasts.map(f => ({
    name: f.name.length > 12 ? f.name.substring(0, 12) + "…" : f.name,
    cells: next6Months.map((_, monthIdx) => {
      // Simple heuristic: risk increases as deadline approaches
      const monthsToDeadline = f.daysRemaining / 30 - monthIdx;
      if (monthsToDeadline < 0) return "done";
      if (f.predictedOnTime === "late" && monthsToDeadline < 2) return "high";
      if (f.rag === "Amber" || (f.predictedOnTime === "late" && monthsToDeadline < 4)) return "medium";
      return "low";
    }),
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">🔮 Forecasting</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-md"><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (forecasts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight">🔮 Forecasting</h1>
        <Card className="rounded-2xl shadow-md">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">No forecast data available</p>
            <p className="text-sm text-muted-foreground mt-1">Once projects are loaded from Salesforce, forecasts will appear here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">🔮 Forecasting</h1>

      {/* AI Forecast Summary */}
      <Card className="rounded-2xl border-2 shadow-xl animate-ai-glow overflow-hidden"
        style={{ borderImage: 'linear-gradient(135deg, hsl(262 52% 47%), hsl(217 91% 60%)) 1' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,52%,47%,0.03)] to-[hsl(217,91%,60%,0.03)]" />
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[hsl(262,52%,47%)] to-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Forecast Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {summaryBullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${b.color} mt-1.5 shrink-0 shadow-sm`} />
                <span className="text-foreground/80">{b.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Portfolio Health Score */}
      <div className="flex items-center gap-6 p-5 bg-card rounded-2xl shadow-md border">
        <HealthGauge score={portfolioHealth} size={90} />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Portfolio Health</p>
          <p className="text-2xl font-extrabold">{portfolioHealth >= 70 ? "Healthy" : portfolioHealth >= 40 ? "Needs Attention" : "Critical"}</p>
          <p className="text-xs text-muted-foreground mt-1">{forecasts.length} projects analysed</p>
        </div>
      </div>

      {/* Deadline Forecast */}
      <div>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Deadline Forecast</h2>
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Predicted completion analysis</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forecasts.map(f => (
            <Card key={f.id} className="rounded-2xl shadow-md card-hover">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm">{f.name}</p>
                  <StatusLight status={f.predictedOnTime} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Days left</span><p className="font-bold text-lg">{f.daysRemaining}</p></div>
                  <div><span className="text-muted-foreground">Complete</span><p className="font-bold text-lg">{Math.round(f.percentComplete)}%</p></div>
                </div>
                {/* Timeline bar */}
                <div className="relative">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Planned</span>
                    <span>Predicted</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                    <div className="h-full bg-primary/30 rounded-full absolute"
                      style={{ width: `${Math.min(100, (f.daysElapsed / f.daysTotal) * 100)}%` }} />
                    <div className="h-full rounded-full absolute"
                      style={{
                        width: `${Math.min(100, f.percentComplete)}%`,
                        background: f.predictedOnTime === "late" ? "hsl(0, 84%, 60%)" : f.predictedOnTime === "early" ? "hsl(160, 84%, 39%)" : "hsl(38, 92%, 50%)",
                      }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Budget Burn Forecast */}
      <div>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Budget Burn Forecast</h2>
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Projected final spend vs budget</p>

        {budgetChartData.length > 0 && (
          <Card className="rounded-2xl shadow-md mb-5">
            <CardContent className="p-5">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={budgetChartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Bar dataKey="budget" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Budget" />
                  <Bar dataKey="predicted" radius={[4, 4, 0, 0]} name="Predicted">
                    {budgetChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forecasts.map(f => (
            <Card key={f.id} className="rounded-2xl shadow-md card-hover">
              <CardContent className="p-5 space-y-2">
                <p className="font-semibold text-sm">{f.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Budget</span><span className="font-medium text-right">€{f.budget.toLocaleString()}</span>
                  <span className="text-muted-foreground">Spent</span><span className="font-medium text-right">€{f.spent.toLocaleString()}</span>
                  <span className="text-muted-foreground">Predicted</span><span className="font-medium text-right">€{f.predictedFinalCost.toLocaleString()}</span>
                  <span className="text-muted-foreground">Over/Under</span>
                  <span className={`font-bold text-right ${f.overUnder > 0 ? "text-destructive" : "text-success"}`}>
                    {f.overUnder > 0 ? "+" : ""}€{f.overUnder.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Project Health Scores */}
      <div>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Project Health Score</h2>
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">AI-calculated 0–100 health per project</p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {forecasts.map(f => (
            <Card key={f.id} className="rounded-2xl shadow-md card-hover">
              <CardContent className="p-5 flex flex-col items-center gap-3">
                <HealthGauge score={f.healthScore} />
                <p className="font-semibold text-xs text-center">{f.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Portfolio Risk Heatmap */}
      <div>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /> Portfolio Risk Heatmap</h2>
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Predicted risk by project over next 6 months</p>
        <Card className="rounded-2xl shadow-md overflow-x-auto">
          <CardContent className="p-5">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Project</th>
                  {next6Months.map(m => (
                    <th key={m.label} className="text-center font-medium text-muted-foreground pb-3 px-2">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4 font-medium">{row.name}</td>
                    {row.cells.map((cell, j) => (
                      <td key={j} className="py-1.5 px-2 text-center">
                        <div className={`h-6 w-full rounded-md mx-auto ${
                          cell === "high" ? "bg-destructive/80" :
                          cell === "medium" ? "bg-warning/70" :
                          cell === "done" ? "bg-muted" :
                          "bg-success/60"
                        }`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-success/60" /> Low</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-warning/70" /> Medium</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-destructive/80" /> High</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted" /> Complete</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
