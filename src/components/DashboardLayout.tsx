import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TopBar } from "@/components/TopBar";

export function DashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefetching, setIsRefetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true);
    await queryClient.invalidateQueries({ queryKey: ["salesforce"] });
    await queryClient.invalidateQueries({ queryKey: ["salesforce-projects"] });
    setLastUpdated(new Date());
    setIsRefetching(false);
  }, [queryClient]);

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          isConnected={true}
          isRefetching={isRefetching}
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="flex-1 p-6 overflow-auto bg-background bg-dot-pattern">
          <div className="animate-page-in">
            <Outlet context={{ searchQuery }} />
          </div>
        </main>
      </div>
    </div>
  );
}
