import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Dashboard } from "@/components/Dashboard";
import { ProductsSection } from "@/components/ProductsSection";
import { CategoriesSection } from "@/components/CategoriesSection";
import { ProvidersSection } from "@/components/ProvidersSection";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun01Icon, MoonIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

// --- Layout component for Root Route ---
function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();

  // Load and apply dark mode setting
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const getSectionTitle = () => {
    const path = location.pathname;
    if (path.includes("/products")) return "Productos";
    if (path.includes("/categories")) return "Categorías";
    if (path.includes("/providers")) return "Proveedores";
    return "Dashboard";
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-300">
          <AppSidebar />

          <SidebarInset className="bg-background flex flex-col min-w-0">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-6 bg-background/55 backdrop-blur-md sticky top-0 z-50">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl" />
                <div className="h-4 w-[1px] bg-border" />
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground font-mono">
                  <span>TechStore</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3 shrink-0" />
                  <span className="text-foreground font-semibold uppercase tracking-wider">
                    {getSectionTitle()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleDarkMode}
                  className="size-8 flex items-center justify-center rounded-xl border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
                  title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                  <HugeiconsIcon
                    icon={isDarkMode ? Sun01Icon : MoonIcon}
                    className="size-4 animate-fade-in"
                  />
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto">
              {/* Children routes render here */}
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <Toaster position="bottom-right" />
      </SidebarProvider>
    </TooltipProvider>
  );
}

// --- Route Declarations ---

const rootRoute = createRootRoute({
  component: RootLayout,
});

// Index redirects to dashboard
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  loader: () => redirect({ to: "/dashboard" }),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductsSection,
});

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories",
  component: CategoriesSection,
});

const providersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/providers",
  component: ProvidersSection,
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  productsRoute,
  categoriesRoute,
  providersRoute,
]);

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
