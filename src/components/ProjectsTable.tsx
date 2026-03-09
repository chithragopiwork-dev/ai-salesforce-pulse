import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesforceProject } from "@/services/salesforce";

interface ProjectsTableProps {
  projects: SalesforceProject[];
  isLoading: boolean;
}

export function ProjectsTable({ projects, isLoading }: ProjectsTableProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Projects Table</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Project ID</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Project Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
                </TableRow>
              ))
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  No projects found. Connect your Salesforce credentials to load data.
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => (
                <TableRow key={p.Id} className="hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.Id}</TableCell>
                  <TableCell className="font-medium">{p.Name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
