import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Target,
  MessageSquare,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AiIntelligence from "@/pages/AiIntelligence";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants & Users",
    url: "/admin",
    icon: Users,
  },
  {
    title: "Delivery Companies",
    url: "/delivery",
    icon: Building2,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: Package,
  },
  {
    title: "Audiences",
    url: "/audiences",
    icon: Target,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: MessageSquare,
  },
  {
    title: "Chatbots",
    url: "/chatbots",
    icon: Bot,
  },
  {
    title: "Ai Intelligence",
    url: "/ai-intelligence",
    icon: Bot,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const {signOut} =useAuth();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return cn(
      "w-full justify-start transition-all duration-200",
      isActive(path)
        ? "nav-active"
        : "nav-inactive"
    );
  };

  return (
    <Sidebar
      className="border-r border-sidebar-border transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="p-0">
        {/* Logo and Brand */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">ODIONS</h2>
                <p className="text-xs text-muted-foreground">E-commerce Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className={cn(
            "text-xs font-medium text-muted-foreground mb-2",
            isCollapsed && "sr-only"
          )}>
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="h-10"
                    isActive={isActive(item.url)}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3 font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Actions */}
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                className="h-10 text-destructive hover:bg-destructive/10"
                tooltip={isCollapsed ? "Logout" : undefined}
              >
               <button
  className="w-full justify-start"
  onClick={() => {
    // STEP 3: Logout logic
    localStorage.removeItem("token");   // remove the token (or session key)
    localStorage.removeItem("user");    // remove user info if stored

    // Redirect to login page
    window.location.href = "/login";
  }}
>
  <LogOut className="h-4 w-4 flex-shrink-0" />
  {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
</button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}