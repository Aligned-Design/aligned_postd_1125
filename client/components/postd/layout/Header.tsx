/**
 * Header component for Postd authenticated shell
 * Displays Postd logo, agency/business name, help, notifications, and user menu
 * 
 * Top nav always shows the logged-in organization/agency, not the brand/client.
 * Brand/client selection is in the left sidebar.
 */

import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { HelpCircle, Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/design-system";

interface HeaderProps {
  onLogout?: () => void;
  onHelpClick?: () => void;
}

/**
 * Simple Postd logo component
 * For now, uses a text-based logo. Can be replaced with SVG asset later.
 */
function PostdLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
        <span className="text-white font-black text-sm">P</span>
      </div>
    </div>
  );
}

export function Header({ onLogout, onHelpClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  // Ensure we always have a valid organization/workspace to display
  // currentWorkspace should always be available due to WorkspaceContext auto-selection
  // But provide fallback to prevent crashes
  const displayWorkspace = currentWorkspace;
  const organizationName = displayWorkspace?.name || "Organization";
  const organizationLogo = displayWorkspace?.logo;

  // Get organization initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center justify-between h-16 px-6">
      {/* Left: Postd Logo + Organization Name */}
      <div className="flex items-center gap-3">
        <PostdLogo className="h-6" />
        <div className="flex items-center gap-2">
          {organizationLogo ? (
            <span className="text-lg">{organizationLogo}</span>
          ) : (
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-700">
                {getInitials(organizationName)}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-slate-700">
            {organizationName}
          </span>
        </div>
      </div>

      {/* Right: Help, Notifications, User Menu */}
      <div className="flex items-center gap-4">
        {/* Help button */}
        <button
          onClick={onHelpClick}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Help"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-700">
                  {user?.name?.substring(0, 1).toUpperCase() || "U"}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-900 hidden sm:inline">
                {user?.name || "User"}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:inline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 border-b border-slate-200">
              <p className="text-sm font-medium text-slate-900">{user?.name || "User"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
            </div>
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default Header;

