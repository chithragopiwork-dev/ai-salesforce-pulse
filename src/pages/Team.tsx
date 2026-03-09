import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const TEAM_FIELDS = ["Id", "Name", "Full_Name__c", "Employee_ID__c", "Role__c", "Department__c", "Assigned_Project__c", "Availability__c", "Location__c", "Status__c", "Daily_Rate_EUR__c"];

export default function Team() {
  const { data: members = [], isLoading } = useSalesforceObject("team_members__c", TEAM_FIELDS, 300_000);
  const onLeave = members.filter((m: any) => m.Status__c === "On Leave");

  return (
    <div className="space-y-5 max-w-6xl">
      <h1 className="text-xl font-semibold">Team</h1>

      {onLeave.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-xs font-medium text-warning">Currently on Leave</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{onLeave.map((m: any) => m.Full_Name__c || m.Name).join(", ")}</p>
        </div>
      )}

      <Card className="border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Name</TableHead>
                  <TableHead className="text-[11px]">Role</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Department</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Project</TableHead>
                  <TableHead className="text-[11px] hidden md:table-cell">Availability</TableHead>
                  <TableHead className="text-[11px] hidden lg:table-cell">Location</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m: any) => (
                  <TableRow key={m.Id}>
                    <TableCell className="text-xs font-medium">{m.Full_Name__c || m.Name}</TableCell>
                    <TableCell className="text-xs">{m.Role__c}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{m.Department__c}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{m.Assigned_Project__c}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{m.Availability__c != null ? `${m.Availability__c}%` : "-"}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{m.Location__c}</TableCell>
                    <TableCell>
                      <Badge variant={m.Status__c === "Active" ? "default" : "secondary"} className="text-[10px]">{m.Status__c}</Badge>
                    </TableCell>
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
