import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";
import type { SalesforceProject } from "@/services/salesforce";

interface ProjectListPanelProps {
  projects: SalesforceProject[];
  isLoading: boolean;
}

export function ProjectListPanel({ projects, isLoading }: ProjectListPanelProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Project List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No projects available</p>
        ) : (
          projects.map((p) => (
            <div
              key={p.Id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.Name}</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">{p.Id}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
