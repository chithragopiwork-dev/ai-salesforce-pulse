import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <header className="h-12 border-b bg-card flex items-center justify-between px-5 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground hidden sm:block">{today}</p>
        {onRefresh && (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={onRefresh} disabled={isRefetching}>
            <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
            {isRefetching ? "Refreshing…" : lastUpdated ? `Updated ${format(lastUpdated, "HH:mm")}` : "Refresh"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-52 hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-7 text-xs bg-secondary border-0"
          />
        </div>
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-medium">
          PM
        </div>
      </div>
    </header>
  );
}
