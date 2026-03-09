import { useQuery } from "@tanstack/react-query";
import { fetchSalesforceProjects, type SalesforceProject } from "@/services/salesforce";

export function useProjects() {
  return useQuery<SalesforceProject[]>({
    queryKey: ["salesforce-projects"],
    queryFn: fetchSalesforceProjects,
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}

// Computed project stats using real Salesforce fields
export function useProjectStats(projects: SalesforceProject[]) {
  const total = projects.length;
  const active = projects.filter(p => p.Status__c === "Active" || p.Status__c === "In Progress").length;
  const completed = projects.filter(p => p.Status__c === "Completed").length;
  const delayed = projects.filter(p => p.Status__c === "Delayed" || p.RAG__c === "Red").length;
  const highRisk = projects.filter(p => p.RAG__c === "Red" || p.RAG__c === "Amber").length;

  const today = new Date();
  const nearingDeadline = projects.filter(p => {
    if (!p.Deadline__c) return false;
    const endDate = new Date(p.Deadline__c);
    const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });

  const overBudget = projects.filter(p => {
    if (!p.Budget_EUR__c || !p.Spent_EUR__c) return false;
    return p.Spent_EUR__c > p.Budget_EUR__c;
  });

  const statusCounts = projects.reduce((acc, p) => {
    const status = p.Status__c || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ragCounts = projects.reduce((acc, p) => {
    const rag = p.RAG__c || "Unknown";
    acc[rag] = (acc[rag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyTrend = projects.reduce((acc, p) => {
    if (!p.Start_Date__c) return acc;
    const month = p.Start_Date__c.substring(0, 7);
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
    ragCounts,
    monthlyTrend,
  };
}
