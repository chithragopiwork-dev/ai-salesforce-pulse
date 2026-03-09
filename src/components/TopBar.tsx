import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TopBarProps {
  isConnected: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function TopBar({ isConnected, isRefetching, onRefresh, lastUpdated, searchQuery, onSearchChange }: TopBarProps) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground hidden sm:block">{today}</p>

        {onRefresh && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onRefresh} disabled={isRefetching}>
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            {isRefetching ? (
              <span className="text-muted-foreground">Refreshing…</span>
            ) : lastUpdated ? (
              <span className="text-muted-foreground">Last updated: {format(lastUpdated, "HH:mm:ss")}</span>
            ) : (
              <span className="hidden sm:inline text-muted-foreground">Refresh</span>
            )}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, people, risks…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm bg-secondary border-0"
          />
        </div>

        <Badge variant="outline" className="gap-1.5 text-xs font-normal shrink-0">
          <span className={cn(
            "h-2 w-2 rounded-full shrink-0",
            isConnected ? "bg-success animate-pulse-dot" : "bg-destructive"
          )} />
          {isConnected ? "Connected" : "Offline"}
        </Badge>

        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
          PM
        </div>
      </div>
    </header>
  );
}
