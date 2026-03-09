import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock, DollarSign, AlertCircle } from "lucide-react";
import type { SalesforceProject } from "@/services/salesforce";

interface RiskOverviewProps {
  highRiskProjects: SalesforceProject[];
  nearingDeadline: SalesforceProject[];
  overBudget: SalesforceProject[];
  isLoading: boolean;
}

export function RiskOverview({ highRiskProjects, nearingDeadline, overBudget, isLoading }: RiskOverviewProps) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasNoRisks = highRiskProjects.length === 0 && nearingDeadline.length === 0 && overBudget.length === 0;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Risk Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasNoRisks ? (
          <Alert className="bg-success/10 border-success">
            <AlertCircle className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">All Clear</AlertTitle>
            <AlertDescription className="text-success/80">
              No high-risk projects, overdue deadlines, or budget overruns detected.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* High Risk Projects */}
            {highRiskProjects.length > 0 && (
              <Alert className="bg-destructive/10 border-destructive">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive font-semibold">
                  High Risk Projects ({highRiskProjects.length})
                </AlertTitle>
                <AlertDescription className="text-destructive/80 text-sm mt-1">
                  {highRiskProjects.slice(0, 3).map(p => p.Name).join(", ")}
                  {highRiskProjects.length > 3 && ` +${highRiskProjects.length - 3} more`}
                </AlertDescription>
              </Alert>
            )}

            {/* Nearing Deadline */}
            {nearingDeadline.length > 0 && (
              <Alert className="bg-warning/10 border-warning">
                <Clock className="h-4 w-4 text-warning" />
                <AlertTitle className="text-warning font-semibold">
                  Nearing Deadline ({nearingDeadline.length})
                </AlertTitle>
                <AlertDescription className="text-warning/80 text-sm mt-1">
                  {nearingDeadline.slice(0, 3).map(p => `${p.Name} (${p.End_Date__c})`).join(", ")}
                  {nearingDeadline.length > 3 && ` +${nearingDeadline.length - 3} more`}
                </AlertDescription>
              </Alert>
            )}

            {/* Over Budget */}
            {overBudget.length > 0 && (
              <Alert className="bg-info/10 border-info">
                <DollarSign className="h-4 w-4 text-info" />
                <AlertTitle className="text-info font-semibold">
                  Over Budget ({overBudget.length})
                </AlertTitle>
                <AlertDescription className="text-info/80 text-sm mt-1">
                  {overBudget.slice(0, 3).map(p => {
                    const variance = ((p.Actual_Cost__c! - p.Budget__c!) / p.Budget__c!) * 100;
                    return `${p.Name} (+${variance.toFixed(0)}%)`;
                  }).join(", ")}
                  {overBudget.length > 3 && ` +${overBudget.length - 3} more`}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
