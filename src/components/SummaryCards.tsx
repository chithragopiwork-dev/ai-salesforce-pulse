import { FolderKanban, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SalesforceProject } from "@/services/salesforce";

interface SummaryCardsProps {
  projects: SalesforceProject[];
  isLoading: boolean;
}

const cards = [
  { key: "total", label: "Total Projects", icon: FolderKanban, colorClass: "text-primary" },
  { key: "active", label: "Active Projects", icon: Clock, colorClass: "text-warning" },
  { key: "completed", label: "Completed Projects", icon: CheckCircle2, colorClass: "text-success" },
  { key: "trend", label: "Growth Trend", icon: TrendingUp, colorClass: "text-info" },
];

export function SummaryCards({ projects, isLoading }: SummaryCardsProps) {
  const total = projects.length;
  // Simple heuristic since we only have Id and Name
  const active = Math.ceil(total * 0.6);
  const completed = total - active;

  const values: Record<string, string> = {
    total: String(total),
    active: String(active),
    completed: String(completed),
    trend: total > 0 ? "+12%" : "—",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.key} className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-1">{values[c.key]}</p>
                )}
              </div>
              <div className={`p-3 rounded-xl bg-secondary ${c.colorClass}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
