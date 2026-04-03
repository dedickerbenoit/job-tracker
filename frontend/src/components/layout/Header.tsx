import { Menu, PanelLeftClose, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/layout/SearchBar";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const userName = t.header.defaultUser; // TODO EPIC-01: real user

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left: sidebar toggle + logo */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? t.header.openMenu : t.header.closeMenu}>
          {sidebarCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
        <span className="text-lg font-bold tracking-tight">JobTracker</span>
      </div>

      {/* Center: search */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <SearchBar />
      </div>

      {/* Right: user menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-7 items-center gap-2 rounded-md px-2.5 text-sm font-medium hover:bg-muted">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{userName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            {t.header.profile}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            {t.header.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
