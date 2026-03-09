import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SalesforceProject } from "@/services/salesforce";

interface EnhancedProjectsTableProps {
  projects: SalesforceProject[];
  isLoading: boolean;
}

type SortField = keyof SalesforceProject | null;
type SortDirection = "asc" | "desc";

const getHealthColor = (health?: string) => {
  switch (health) {
    case "Healthy": return "bg-success text-success-foreground";
    case "At Risk": return "bg-warning text-warning-foreground";
    case "Delayed": return "bg-destructive text-destructive-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case "Critical": return "bg-destructive text-destructive-foreground";
    case "High": return "bg-warning text-warning-foreground";
    case "Medium": return "bg-info text-info-foreground";
    case "Low": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case "Active": return "bg-success text-success-foreground";
    case "Completed": return "bg-primary text-primary-foreground";
    case "On Hold": return "bg-warning text-warning-foreground";
    case "Delayed": return "bg-destructive text-destructive-foreground";
    case "Planning": return "bg-info text-info-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

export function EnhancedProjectsTable({ projects, isLoading }: EnhancedProjectsTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterText, setFilterText] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredProjects = projects.filter(p => 
    p.Name?.toLowerCase().includes(filterText.toLowerCase()) ||
    p.Project_Manager__c?.toLowerCase().includes(filterText.toLowerCase()) ||
    p.Status__c?.toLowerCase().includes(filterText.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === undefined || bVal === undefined) return 0;
    
    const direction = sortDirection === "asc" ? 1 : -1;
    return aVal > bVal ? direction : -direction;
  });

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Projects Overview</CardTitle>
          <Input
            placeholder="Filter projects..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold text-xs uppercase">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("Name")} className="h-8 px-2">
                    Project Name <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("Project_Manager__c")} className="h-8 px-2">
                    Manager <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("Status__c")} className="h-8 px-2">
                    Status <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("Priority__c")} className="h-8 px-2">
                    Priority <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("Start_Date__c")} className="h-8 px-2">
                    Start Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("End_Date__c")} className="h-8 px-2">
                    End Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("Budget__c")} className="h-8 px-2">
                    Budget <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase">Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {filterText ? "No projects match your filter" : "No projects found"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedProjects.map((p) => (
                  <TableRow key={p.Id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell className="font-medium">{p.Name}</TableCell>
                    <TableCell className="text-sm">{p.Project_Manager__c || "—"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(p.Status__c)} variant="secondary">
                        {p.Status__c || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(p.Priority__c)} variant="secondary">
                        {p.Priority__c || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {p.Start_Date__c || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {p.End_Date__c || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${p.Budget__c?.toLocaleString() || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getHealthColor(p.Health_Status__c)} variant="secondary">
                        {p.Health_Status__c || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
