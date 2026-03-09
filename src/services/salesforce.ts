import { supabase } from "@/integrations/supabase/client";

export interface SalesforceProject {
  Id: string;
  Name: string;
  Project_Name__c?: string;
  Project_ID__c?: string;
  Coordinator__c?: string;
  Status__c?: string;
  Start_Date__c?: string;
  Deadline__c?: string;
  Budget_EUR__c?: number;
  Spent_EUR__c?: number;
  Percent_Complete__c?: number;
  RAG__c?: string;
  CreatedDate?: string;
}

export interface SalesforceResponse {
  records: SalesforceProject[];
  totalSize: number;
  done: boolean;
}

const PROJECT_FIELDS = "Id,Name,Project_Name__c,Project_ID__c,Coordinator__c,Status__c,Start_Date__c,Deadline__c,Budget_EUR__c,Spent_EUR__c,Percent_Complete__c,RAG__c";

export async function fetchSalesforceProjects(): Promise<SalesforceProject[]> {
  const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
    body: {
      endpoint: "/services/data/v62.0/query",
      params: { q: `SELECT ${PROJECT_FIELDS} FROM projects__c` },
    },
  });

  if (error) throw new Error(`Salesforce fetch failed: ${error.message}`);
  return data?.records ?? [];
}

// Extensible: fetch any Salesforce object
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
