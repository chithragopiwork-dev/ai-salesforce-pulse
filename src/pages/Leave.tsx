import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const LEAVE_FIELDS = ["Id", "Name", "Employee__c", "Leave_Type__c", "Start_Date__c", "End_Date__c", "Days__c", "Approved_By__c"];

function leaveColor(type?: string) {
  if (type === "Annual Leave") return "bg-info text-info-foreground";
  if (type === "Sick Leave") return "bg-warning text-warning-foreground";
  if (type === "Paternity Leave") return "bg-success text-success-foreground";
  return "bg-muted text-muted-foreground";
}

export default function Leave() {
  const { data: leaves = [], isLoading } = useSalesforceObject("vacations__c", LEAVE_FIELDS, 300_000);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave</h1>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Leave Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="hidden md:table-cell">Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((l: any) => (
                  <TableRow key={l.Id}>
                    <TableCell className="font-medium text-sm">{l.Employee__c || l.Name}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${leaveColor(l.Leave_Type__c)}`}>{l.Leave_Type__c}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{l.Start_Date__c}</TableCell>
                    <TableCell className="text-sm">{l.End_Date__c}</TableCell>
                    <TableCell className="text-right text-sm">{l.Days__c}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{l.Approved_By__c}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
