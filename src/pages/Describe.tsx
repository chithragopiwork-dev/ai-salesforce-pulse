import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const OBJECTS = [
  "projects__c",
  "risks__c",
  "timesheets__c",
  "team_members__c",
  "vacations__c",
  "project_updates__c",
];

interface FieldInfo {
  name: string;
  label: string;
  type: string;
  custom: boolean;
}

export default function Describe() {
  const [results, setResults] = useState<Record<string, FieldInfo[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDescribe() {
      const allResults: Record<string, FieldInfo[]> = {};

      await Promise.all(
        OBJECTS.map(async (obj) => {
          try {
            const { data, error } = await supabase.functions.invoke("salesforce-proxy", {
              body: {
                endpoint: `/services/data/v57.0/sobjects/${obj}/describe`,
                params: {},
              },
            });

            if (error || !data?.fields) {
              allResults[obj] = [];
              return;
            }

            allResults[obj] = data.fields
              .filter((f: any) => f.custom)
              .map((f: any) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                custom: f.custom,
              }));
          } catch {
            allResults[obj] = [];
          }
        })
      );

      setResults(allResults);
      setLoading(false);
    }

    fetchDescribe();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Salesforce Describe Results</h1>
        <p className="text-sm text-muted-foreground">Temporary page — showing custom fields for each object</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {OBJECTS.map((obj) => (
            <Skeleton key={obj} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        OBJECTS.map((obj) => (
          <Card key={obj} className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-mono">{obj}</CardTitle>
            </CardHeader>
            <CardContent>
              {results[obj]?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No custom fields found or error fetching.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {results[obj]?.map((field) => (
                    <div key={field.name} className="flex items-center gap-2 p-2 rounded border text-sm">
                      <code className="font-mono text-xs text-primary">{field.name}</code>
                      <Badge variant="outline" className="text-[10px] shrink-0">{field.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
