import { useQuery } from "@tanstack/react-query";
import { fetchSalesforceProjects, type SalesforceProject } from "@/services/salesforce";

export function useProjects() {
  return useQuery<SalesforceProject[]>({
    queryKey: ["salesforce-projects"],
    queryFn: fetchSalesforceProjects,
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 60_000, // Auto-refresh every 60 seconds
  });
}

// Computed project stats
export function useProjectStats(projects: SalesforceProject[]) {
  const total = projects.length;
  const active = projects.filter(p => p.Status__c === "Active").length;
  const completed = projects.filter(p => p.Status__c === "Completed").length;
  const delayed = projects.filter(p => p.Status__c === "Delayed" || p.Health_Status__c === "Delayed").length;
  const highRisk = projects.filter(p => p.Risk_Level__c === "High" || p.Health_Status__c === "At Risk").length;
  
  // Projects nearing deadline (within 30 days)
  const today = new Date();
  const nearingDeadline = projects.filter(p => {
    if (!p.End_Date__c) return false;
    const endDate = new Date(p.End_Date__c);
    const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });

  // Projects over budget
  const overBudget = projects.filter(p => {
    if (!p.Budget__c || !p.Actual_Cost__c) return false;
    return p.Actual_Cost__c > p.Budget__c;
  });

  // Status distribution
  const statusCounts = projects.reduce((acc, p) => {
    const status = p.Status__c || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Priority distribution
  const priorityCounts = projects.reduce((acc, p) => {
    const priority = p.Priority__c || "Unknown";
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Projects by month (for trend)
  const monthlyTrend = projects.reduce((acc, p) => {
    if (!p.Start_Date__c) return acc;
    const month = p.Start_Date__c.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    active,
    completed,
    delayed,
    highRisk,
    nearingDeadline,
    overBudget,
    statusCounts,
    priorityCounts,
    monthlyTrend,
  };
}
