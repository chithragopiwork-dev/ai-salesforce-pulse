import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const TS_FIELDS = ["Id", "Name", "Employee__c", "Project__c", "Week_1_Hours__c", "Week_2_Hours__c", "Week_3_Hours__c", "Week_4_Hours__c", "Total_Hours__c", "Budget_Hours__c", "Variance__c", "Status__c"];

export default function Timesheets() {
  const { data: timesheets = [], isLoading } = useSalesforceObject("timesheets__c", TS_FIELDS, 600_000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Timesheets</h1>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">W1</TableHead>
                  <TableHead className="text-right">W2</TableHead>
                  <TableHead className="text-right">W3</TableHead>
                  <TableHead className="text-right">W4</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((t: any) => {
                  const total = t.Total_Hours__c ?? 0;
                  const budget = t.Budget_Hours__c ?? 0;
                  const variance = t.Variance__c ?? (budget - total);
                  return (
                    <TableRow key={t.Id}>
                      <TableCell className="font-medium text-sm">{t.Employee__c || t.Name}</TableCell>
                      <TableCell className="text-sm">{t.Project__c}</TableCell>
                      <TableCell className="text-right text-sm">{t.Week_1_Hours__c ?? "-"}</TableCell>
                      <TableCell className="text-right text-sm">{t.Week_2_Hours__c ?? "-"}</TableCell>
                      <TableCell className="text-right text-sm">{t.Week_3_Hours__c ?? "-"}</TableCell>
                      <TableCell className="text-right text-sm">{t.Week_4_Hours__c ?? "-"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{total}</TableCell>
                      <TableCell className="text-right text-sm">{budget}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`text-[10px] ${variance < 0 ? "text-destructive border-destructive/30" : "text-success border-success/30"}`}>
                          {variance > 0 ? "+" : ""}{variance}h
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
