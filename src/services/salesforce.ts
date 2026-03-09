import { supabase } from "@/integrations/supabase/client";

export interface SalesforceProject {
  Id: string;
  Name: string;
}

export interface SalesforceResponse {
  records: SalesforceProject[];
  totalSize: number;
  done: boolean;
}

export async function fetchSalesforceProjects(): Promise<SalesforceProject[]> {
  const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
    body: {
      endpoint: "/services/data/v62.0/query",
      params: { q: "SELECT Id,Name FROM projects__c" },
    },
  });

  if (error) throw new Error(`Salesforce fetch failed: ${error.message}`);
  return data?.records ?? [];
}

// Extensible: add more fetch functions for other objects
export async function fetchSalesforceObject(objectName: string, fields: string[]): Promise<any[]> {
  const query = `SELECT ${fields.join(",")} FROM ${objectName}`;
  const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
    body: {
      endpoint: "/services/data/v62.0/query",
      params: { q: query },
    },
  });

  if (error) throw new Error(`Salesforce fetch failed: ${error.message}`);
  return data?.records ?? [];
}
