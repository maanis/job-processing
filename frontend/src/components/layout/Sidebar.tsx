import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  LogOut,
  LayoutDashboard,
  Settings,
  CreditCard,
  ChevronUp,
  Sparkles,
  User,
  Zap,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

// Shadcn UI Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// menu items will be built per-role inside the component

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);

  // Get user from localStorage
  const storedUser = localStorage.getItem('user');
  const userData = storedUser ? JSON.parse(storedUser) : null;
  const storedRole = localStorage.getItem('role');
  const role = userData?.role || storedRole || 'user';

  const menuItems = role === 'admin'
    ? [
      { icon: LayoutDashboard, label: 'Admin Overview', path: '/admin/dashboard' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ]
    : [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];

  const user = {
    name: userData?.username || "User",
    email: userData?.email || "",
    avatar: userData?.username?.slice(0, 2).toUpperCase() || "U",
    plan: "Pro Plan",
    credits: 1250,
    maxCredits: 5000
  };

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-border bg-card/50 backdrop-blur-xl">

      {/* 1. Header */}
      <div className="flex h-20 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">BulkProcessor</h1>
            <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0 text-xs font-medium text-green-600 ring-1 ring-inset ring-green-600/20">
              Beta v2.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Navigation (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
          {/* {userData?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                location.pathname === '/admin/dashboard'
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <FileText className={cn("h-4 w-4", location.pathname === '/admin/dashboard' ? "text-primary-foreground" : "text-muted-foreground")} />
              Admin
            </Link>
          )} */}
        </nav>
      </div>

      {/* 3. Bottom Section Wrapper */}
      <div className="mt-auto px-4 pb-4">

        {/* --- USAGE CARD (Always Visible behind the menu) --- */}
        <div className={cn(
          "mb-4 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-secondary/50 p-4 transition-all duration-300",
          // When profile is expanded, we dim this card slightly to focus on the menu
          isProfileExpanded ? "opacity-40 blur-[2px]" : "opacity-100"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Credits Used</p>
              <p className="text-xs text-muted-foreground">{user.credits} / {user.maxCredits}</p>
            </div>
          </div>
          <Progress value={(user.credits / user.maxCredits) * 100} className="h-2 bg-secondary" indicatorClassName="bg-orange-500" />
          <Button variant="outline" size="sm" className="mt-3 w-full text-xs h-7 bg-background/50 hover:bg-background">
            Upgrade Plan
          </Button>
        </div>

        {/* --- THE SLIDE-UP MENU (Absolute Positioned) --- */}
        <div className="relative">
          <div
            className={cn(
              "absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-20 origin-bottom overflow-hidden rounded-xl border border-border bg-popover shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              isProfileExpanded
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-8 pointer-events-none"
            )}
          >
            <div className="p-2 space-y-1">
              <button onClick={() => navigate('/settings')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                <User className="h-4 w-4 text-muted-foreground" />
                Account Settings
              </button>
              {/* <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Manage Subscription
              </button> */}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => setIsLogoutOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>

          {/* --- PROFILE TOGGLE BUTTON --- */}
          <button
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:bg-secondary/50 outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isProfileExpanded && "border-primary/50 ring-2 ring-primary/10 bg-secondary/50"
            )}
          >
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs">
                {user.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.plan}</p>
            </div>
            <ChevronUp
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-300",
                isProfileExpanded && "rotate-180 text-foreground"
              )}
            />
          </button>
        </div>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <AlertDialogContent onClose={() => setIsLogoutOpen(false)}>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be returned to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsLogoutOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsLogoutOpen(false);
                navigate('/login');
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}