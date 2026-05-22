import { NavLink } from "react-router-dom";
import { Kanban, List, Clock, BarChart3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { ChromeIcon } from "@/components/icons/ChromeIcon";
import { useExtensionDetected } from "@/hooks/useExtensionDetected";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/jobtracker-beta/bcnfmhkdkhegkobfomeipijlcldjaiad";

const navItems = [
  { to: "/dashboard/kanban", label: t.sidebar.kanban, icon: Kanban },
  { to: "/dashboard/list", label: t.sidebar.list, icon: List },
  { to: "/dashboard/timeline", label: t.sidebar.timeline, icon: Clock },
  { to: "/dashboard/stats", label: t.sidebar.stats, icon: BarChart3 },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const extensionDetected = useExtensionDetected();

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <nav
        aria-label={t.sidebar.navLabel}
        className="flex flex-1 flex-col gap-1 p-3"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70",
                collapsed && "justify-center px-2",
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        {extensionDetected ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-green-600",
              collapsed && "justify-center px-2",
            )}
          >
            <Check className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t.sidebar.extensionInstalled}</span>}
          </div>
        ) : (
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <ChromeIcon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t.sidebar.extensionCta}</span>}
          </a>
        )}
      </div>
    </aside>
  );
}
