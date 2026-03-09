import { useQuery } from "@tanstack/react-query";
import { fetchSalesforceProjects, type SalesforceProject } from "@/services/salesforce";

export function useProjects() {
  return useQuery<SalesforceProject[]>({
    queryKey: ["salesforce-projects"],
    queryFn: fetchSalesforceProjects,
    retry: 1,
    staleTime: 60_000,
  });
}
