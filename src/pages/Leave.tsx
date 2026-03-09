import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const LEAVE_FIELDS = ["Id", "Name", "Employee__c", "Leave_Type__c", "Start_Date__c", "End_Date__c", "Days__c", "Approved_By__c", "Department__c"];

function leaveStyle(type?: string) {
  if (type === "Annual Leave") return "text-info border-info/30";
  if (type === "Sick Leave") return "text-warning border-warning/30";
  if (type === "Paternity Leave") return "text-success border-success/30";
  return "";
}

export default function Leave() {
  const { data: leaves = [], isLoading } = useSalesforceObject("vacations__c", LEAVE_FIELDS, 300_000);

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-semibold">Leave</h1>

      <Card className="border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Employee</TableHead>
                  <TableHead className="text-[11px]">Type</TableHead>
                  <TableHead className="text-[11px]">Start</TableHead>
                  <TableHead className="text-[11px]">End</TableHead>
                  <TableHead className="text-[11px] text-right">Days</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Approved By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((l: any) => (
                  <TableRow key={l.Id}>
                    <TableCell className="text-xs font-medium">{l.Employee__c || l.Name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${leaveStyle(l.Leave_Type__c)}`}>{l.Leave_Type__c}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{l.Start_Date__c}</TableCell>
                    <TableCell className="text-xs">{l.End_Date__c}</TableCell>
                    <TableCell className="text-right text-xs">{l.Days__c}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{l.Approved_By__c}</TableCell>
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
