import { useState } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { TopBar } from "@/components/TopBar";

export function DashboardLayout() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex min-h-screen w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          isConnected={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="flex-1 p-6 overflow-auto bg-background">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
}
