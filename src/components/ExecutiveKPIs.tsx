import { FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExecutiveKPIsProps {
  total: number;
  active: number;
  completed: number;
  delayed: number;
  highRisk: number;
  isLoading: boolean;
}

const kpiCards = [
  { 
    key: "total", 
    label: "Total Projects", 
    icon: FolderKanban, 
    colorClass: "text-primary",
    bgClass: "bg-primary/10"
  },
  { 
    key: "active", 
    label: "Active Projects", 
    icon: TrendingUp, 
    colorClass: "text-info",
    bgClass: "bg-info/10"
  },
  { 
    key: "completed", 
    label: "Completed Projects", 
    icon: CheckCircle2, 
    colorClass: "text-success",
    bgClass: "bg-success/10"
  },
  { 
    key: "delayed", 
    label: "Delayed Projects", 
    icon: Clock, 
    colorClass: "text-warning",
    bgClass: "bg-warning/10"
  },
  { 
    key: "highRisk", 
    label: "High Risk Projects", 
    icon: AlertTriangle, 
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10"
  },
];

export function ExecutiveKPIs({ total, active, completed, delayed, highRisk, isLoading }: ExecutiveKPIsProps) {
  const values: Record<string, number> = {
    total,
    active,
    completed,
    delayed,
    highRisk,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiCards.map((card) => (
        <Card key={card.key} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-1">{values[card.key]}</p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${card.bgClass}`}>
                <card.icon className={`h-6 w-6 ${card.colorClass}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
