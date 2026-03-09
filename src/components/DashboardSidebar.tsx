import { LayoutDashboard, FolderKanban, Users, Clock, Palmtree, AlertTriangle, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSalesforceObject } from "@/hooks/useSalesforceData";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: FolderKanban },
  { title: "Team", url: "/team", icon: Users },
  { title: "Timesheets", url: "/timesheets", icon: Clock },
  { title: "Leave", url: "/leave", icon: Palmtree },
  { title: "Risks", url: "/risks", icon: AlertTriangle, hasBadge: true },
  { title: "Updates", url: "/updates", icon: FileText },
];

export function DashboardSidebar() {
  const { data: risks = [] } = useSalesforceObject("risks__c", ["Id", "Risk_Score__c"], 120_000);
  const criticalRisks = risks.filter((r: any) => r.Risk_Score__c === "Critical" || r.Risk_Score__c === "High").length;

  return (
    <aside className="w-56 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <h1 className="text-sm font-semibold text-sidebar-primary-foreground tracking-wide">PMO Hub</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className="group flex items-center gap-2.5 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-[13px]"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.title}</span>
            {item.hasBadge && criticalRisks > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                {criticalRisks}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <p className="text-[11px] text-sidebar-foreground/50">Salesforce Connected</p>
        </div>
      </div>
    </aside>
  );
}
