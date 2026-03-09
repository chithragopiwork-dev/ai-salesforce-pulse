import { LayoutDashboard, FolderKanban, Users, Clock, Palmtree, AlertTriangle, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: FolderKanban },
  { title: "Team", url: "/team", icon: Users },
  { title: "Timesheets", url: "/timesheets", icon: Clock },
  { title: "Leave", url: "/leave", icon: Palmtree },
  { title: "Risks", url: "/risks", icon: AlertTriangle },
  { title: "Updates", url: "/updates", icon: FileText },
];

export function DashboardSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground tracking-tight">
          PMO Hub
        </h1>
        <p className="text-[11px] text-sidebar-foreground/50 mt-1">Project Management Office</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/40">Salesforce Connected</p>
      </div>
    </aside>
  );
}
