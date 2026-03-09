import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const TEAM_FIELDS = ["Id", "Name", "Role__c", "Department__c", "Assigned_Project__c", "Availability__c", "Location__c", "Status__c"];

export default function Team() {
  const { data: members = [], isLoading } = useSalesforceObject("team_members__c", TEAM_FIELDS, 300_000);

  const onLeave = members.filter((m: any) => m.Status__c === "On Leave");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Team</h1>

      {onLeave.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning">🏖️ Currently on Leave</p>
          <p className="text-xs text-muted-foreground mt-1">{onLeave.map((m: any) => m.Name).join(", ")}</p>
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Department</TableHead>
                  <TableHead className="hidden lg:table-cell">Project</TableHead>
                  <TableHead className="hidden md:table-cell">Availability</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m: any) => (
                  <TableRow key={m.Id}>
                    <TableCell className="font-medium text-sm">{m.Name}</TableCell>
                    <TableCell className="text-sm">{m.Role__c}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{m.Department__c}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{m.Assigned_Project__c}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{m.Availability__c}%</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{m.Location__c}</TableCell>
                    <TableCell>
                      <Badge variant={m.Status__c === "Active" ? "default" : "secondary"} className="text-[10px]">
                        {m.Status__c}
                      </Badge>
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
