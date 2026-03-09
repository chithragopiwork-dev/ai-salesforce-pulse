import { useQuery } from "@tanstack/react-query";
import { fetchSalesforceObject } from "@/services/salesforce";

export function useSalesforceObject(objectName: string, fields: string[], refetchInterval = 120_000) {
  return useQuery<any[]>({
    queryKey: ["salesforce", objectName],
    queryFn: () => fetchSalesforceObject(objectName, fields),
    retry: 1,
    staleTime: refetchInterval / 2,
    refetchInterval,
  });
}
