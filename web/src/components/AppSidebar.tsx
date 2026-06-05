import { Link } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  PackageIcon,
  TagIcon,
  UserGroupIcon,
  StoreIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const dashboardItem = {
    to: "/dashboard",
    label: "Dashboard",
    icon: DashboardCircleIcon,
    description: "Overview & Analytics",
  };

  const productsItem = {
    to: "/products",
    label: "Productos",
    icon: PackageIcon,
    description: "Inventory Management",
  };

  const catalogItems = [
    {
      to: "/categories",
      label: "Categorías",
      icon: TagIcon,
      description: "Product Classification",
    },
    {
      to: "/providers",
      label: "Proveedores",
      icon: UserGroupIcon,
      description: "Supply Sources",
    },
  ];

  const renderItem = (item: typeof dashboardItem) => (
    <SidebarMenuItem key={item.to}>
      <SidebarMenuButton asChild>
        <Link
          to={item.to}
          activeProps={{
            className: "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary hover:text-primary-foreground",
          }}
          inactiveProps={{
            className: "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
          title={item.label}
        >
          {({ isActive }) => (
            <>
              <div className="flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={item.icon}
                  className={cn(
                    "size-5 transition-transform duration-200 group-hover:scale-105",
                    isActive ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground"
                  )}
                />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-medium text-xs font-heading">{item.label}</span>
                <span
                  className={cn(
                    "text-[9px] mt-0.5 font-mono",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground/50 group-hover:text-muted-foreground/70"
                  )}
                >
                  {item.description}
                </span>
              </div>

              {isActive && (
                <div className="absolute right-2 size-1.5 rounded-full bg-primary-foreground animate-ping" />
              )}
            </>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar variant="sidebar" className="border-r border-border bg-sidebar/50 backdrop-blur-md">
      <SidebarHeader className="flex flex-row items-center gap-3 p-4 border-b border-border">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-2 ring-primary/20 animate-pulse">
          <HugeiconsIcon icon={StoreIcon} className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-sm tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            TECH STORE
          </span>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Inventory Manager
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Group 1: General */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/60 px-3 mb-2 font-mono">
            General
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {renderItem(dashboardItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 2: Productos */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/60 px-3 mb-2 font-mono">
            Productos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {renderItem(productsItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Group 3: Catálogos */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/60 px-3 mb-2 font-mono">
            Catálogos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {catalogItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">John Doe</span>
            <span className="text-[10px] text-muted-foreground font-mono">Store Manager</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
