import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  MapPin,
  GitBranch,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "EV vs ICE Calculator", href: "/calculator", icon: Calculator },
  { name: "City Analysis", href: "/city-analysis", icon: MapPin },
  { name: "What-If Scenarios", href: "/scenarios", icon: GitBranch },
  { name: "System Architecture", href: "/architecture", icon: Layers },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, signOut } = useAuth();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-ev">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">EV-DSS</span>
              <span className="text-xs text-sidebar-foreground/60">Decision Support</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary-foreground")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - User Auth */}
      <div className="border-t border-sidebar-border p-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            user ? "gradient-ev" : "bg-muted"
          )}>
            <User className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : user ? (
                <>
                  <p className="text-xs text-sidebar-foreground/60">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not signed in</p>
              )}
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAuthAction}
              className="h-8 w-8 shrink-0"
              title={user ? "Sign out" : "Sign in"}
            >
              {user ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAuthAction}
            className="w-full mt-2"
            title={user ? "Sign out" : "Sign in"}
          >
            {user ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-md hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </aside>
  );
}
