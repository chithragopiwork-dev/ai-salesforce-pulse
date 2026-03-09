import { LayoutDashboard, FolderKanban, AlertTriangle, Users, Clock, Flag, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Risks", url: "/risks", icon: AlertTriangle, disabled: true },
  { title: "Team", url: "/team", icon: Users, disabled: true },
  { title: "Timesheets", url: "/timesheets", icon: Clock, disabled: true },
  { title: "Milestones", url: "/milestones", icon: Flag, disabled: true },
  { title: "Updates", url: "/updates", icon: FileText, disabled: true },
];

export function DashboardSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground tracking-tight">
          AI PMO
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Project Management Office</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.title}>
            {item.disabled ? (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/40 cursor-not-allowed text-sm">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
                <span className="ml-auto text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded text-sidebar-foreground/50">Soon</span>
              </div>
            ) : (
              <NavLink
                to={item.url}
                end
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/40">Salesforce Connected</p>
      </div>
    </aside>
  );
}
