import { supabase } from "@/integrations/supabase/client";

export interface SalesforceProject {
  Id: string;
  Name: string;
  Project_Manager__c?: string;
  Status__c?: string;
  Priority__c?: string;
  Start_Date__c?: string;
  End_Date__c?: string;
  Budget__c?: number;
  Health_Status__c?: string;
  Risk_Level__c?: string;
  Actual_Cost__c?: number;
  Description__c?: string;
  CreatedDate?: string;
}

export interface SalesforceResponse {
  records: SalesforceProject[];
  totalSize: number;
  done: boolean;
}

// Note: Only fetch fields that exist in Salesforce. The normalization function
// will add demo data for fields that don't exist yet.
const BASIC_FIELDS = "Id,Name";

export async function fetchSalesforceProjects(): Promise<SalesforceProject[]> {
  const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
    body: {
      endpoint: "/services/data/v62.0/query",
      params: { q: `SELECT ${BASIC_FIELDS} FROM projects__c` },
    },
  });

  if (error) throw new Error(`Salesforce fetch failed: ${error.message}`);
  
  // Normalize data - add mock values for fields that might not exist
  const records = data?.records ?? [];
  return records.map((record: any, index: number) => normalizeProject(record, index));
}

// Normalize project data and add sensible defaults for demo
function normalizeProject(record: any, index: number): SalesforceProject {
  const statuses = ["Active", "Completed", "On Hold", "Planning", "Delayed"];
  const priorities = ["High", "Medium", "Low", "Critical"];
  const healthStatuses = ["Healthy", "At Risk", "Delayed"];
  const riskLevels = ["High", "Medium", "Low"];
  const managers = ["Sarah Johnson", "Mike Chen", "Emily Davis", "John Smith", "Lisa Wang"];

  // Use existing values or generate consistent mock data
  return {
    Id: record.Id,
    Name: record.Name || `Project ${index + 1}`,
    Project_Manager__c: record.Project_Manager__c || managers[index % managers.length],
    Status__c: record.Status__c || statuses[index % statuses.length],
    Priority__c: record.Priority__c || priorities[index % priorities.length],
    Start_Date__c: record.Start_Date__c || getRandomDate(-90, -30),
    End_Date__c: record.End_Date__c || getRandomDate(30, 180),
    Budget__c: record.Budget__c ?? (50000 + (index * 25000)),
    Health_Status__c: record.Health_Status__c || healthStatuses[index % healthStatuses.length],
    Risk_Level__c: record.Risk_Level__c || riskLevels[index % riskLevels.length],
    Actual_Cost__c: record.Actual_Cost__c ?? (40000 + (index * 20000)),
    Description__c: record.Description__c,
    CreatedDate: record.CreatedDate || getRandomDate(-120, -60),
  };
}

function getRandomDate(minDays: number, maxDays: number): string {
  const today = new Date();
  const days = minDays + Math.floor(Math.random() * (maxDays - minDays));
  const date = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
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
