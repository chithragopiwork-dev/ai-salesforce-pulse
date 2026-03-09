import { LayoutDashboard, FolderKanban, Users, Clock, Palmtree, AlertTriangle, FileText, Brain, TrendingUp } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: FolderKanban },
  { title: "Forecasting", url: "/forecasting", icon: TrendingUp, isNew: true },
  { title: "Team", url: "/team", icon: Users },
  { title: "Timesheets", url: "/timesheets", icon: Clock },
  { title: "Leave", url: "/leave", icon: Palmtree },
  { title: "Risks", url: "/risks", icon: AlertTriangle, hasBadge: true },
  { title: "Updates", url: "/updates", icon: FileText, hasBadge: true },
];

export function DashboardSidebar() {
  const { data: risks = [] } = useSalesforceObject("risks__c", ["Id", "Risk_Score__c"], 120_000);
  const criticalRisks = risks.filter((r: any) => r.Risk_Score__c === "Critical" || r.Risk_Score__c === "High").length;

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-[hsl(262,52%,47%)] flex items-center justify-center shadow-lg">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-sidebar-primary-foreground tracking-tight">
              PMO Hub
            </h1>
            <p className="text-[10px] text-sidebar-foreground/40 leading-tight">AI Project Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 text-sm"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r-full before:bg-primary"
          >
            <item.icon className="h-4 w-4 shrink-0 transition-colors" />
            <span className="flex-1">{item.title}</span>
            {item.isNew && (
              <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">NEW</span>
            )}
            {item.hasBadge && item.title === "Risks" && criticalRisks > 0 && (
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {criticalRisks}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          <p className="text-[10px] text-sidebar-foreground/40">Salesforce Connected</p>
        </div>
      </div>
    </aside>
  );
}
