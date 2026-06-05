import { useQuery } from "@apollo/client/react";
import { useNavigate } from "@tanstack/react-router";
import { GET_DASHBOARD_DATA } from "@/graphql/operations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  TagIcon,
  UserGroupIcon,
  Alert02Icon,
  ArrowUpRight01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  CoinsIcon,
  DollarIcon,
  StoreIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateExecutivePDFReport } from "@/lib/export";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const categoryChartConfig = {
  value: {
    label: "Valor Total",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const providerChartConfig = {
  value: {
    label: "Valor Total",
    color: "oklch(0.6 0.2 300)",
  },
} satisfies ChartConfig;

export function Dashboard() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      toast.info("Generando Reporte PDF Ejecutivo...");

      const allProducts = (dashboardData as any)?.allProducts || [];

      // Calculate category aggregation for table
      const catMap: Record<string, { id: number; name: string; count: number; value: number }> = {};
      // Calculate provider aggregation for table
      const provMap: Record<string, { id: number; name: string; count: number; value: number }> = {};

      allProducts.forEach((p: any) => {
        // Category
        const catId = p.category?.id || 0;
        const catName = p.category?.name || "Sin Categoría";
        if (!catMap[catName]) {
          catMap[catName] = { id: catId, name: catName, count: 0, value: 0 };
        }
        catMap[catName].count += 1;
        catMap[catName].value += p.price * p.stock;

        // Provider
        const provId = p.provider?.id || 0;
        const provName = p.provider?.name || "Sin Proveedor";
        if (!provMap[provName]) {
          provMap[provName] = { id: provId, name: provName, count: 0, value: 0 };
        }
        provMap[provName].count += 1;
        provMap[provName].value += p.price * p.stock;
      });

      const categories = Object.values(catMap);
      const providers = Object.values(provMap);

      generateExecutivePDFReport({
        summary: {
          totalInventoryValue: stats.totalInventoryValue,
          totalStock: stats.totalStock,
          averagePrice: stats.averagePrice,
          totalProducts: stats.totalProducts,
          totalCategories: (dashboardData as any)?.totalCategories || 0,
          totalProviders: (dashboardData as any)?.totalProviders || 0,
        },
        categories,
        providers,
        products: allProducts,
      });

      toast.success("PDF generado con éxito");
    } catch (err: any) {
      toast.error(`Error al generar PDF: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Load general dashboard metadata and full catalog in a single GraphQL query
  const { data: dashboardData, loading, error } = useQuery(GET_DASHBOARD_DATA, {
    fetchPolicy: "cache-and-network",
  });

  // Aggregate stats from the full products list
  const stats = useMemo(() => {
    const allProducts = (dashboardData as any)?.allProducts || [];
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter((p: any) => p.status === "ACTIVE").length;
    const totalInventoryValue = allProducts.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0);
    const averagePrice = totalProducts > 0 
      ? allProducts.reduce((sum: number, p: any) => sum + p.price, 0) / totalProducts 
      : 0;
    const totalStock = allProducts.reduce((sum: number, p: any) => sum + p.stock, 0);
    const lowStockCount = allProducts.filter((p: any) => p.stock <= 5).length;

    // Category aggregation
    const catMap: Record<string, { name: string; count: number; value: number }> = {};
    // Provider aggregation
    const provMap: Record<string, { name: string; count: number; value: number }> = {};

    allProducts.forEach((p: any) => {
      // Category
      const catName = p.category?.name || "Sin Categoría";
      if (!catMap[catName]) {
        catMap[catName] = { name: catName, count: 0, value: 0 };
      }
      catMap[catName].count += 1;
      catMap[catName].value += p.price * p.stock;

      // Provider
      const provName = p.provider?.name || "Sin Proveedor";
      if (!provMap[provName]) {
        provMap[provName] = { name: provName, count: 0, value: 0 };
      }
      provMap[provName].count += 1;
      provMap[provName].value += p.price * p.stock;
    });

    const categoryStats = Object.values(catMap).sort((a, b) => b.value - a.value);
    const providerStats = Object.values(provMap).sort((a, b) => b.value - a.value);

    return {
      totalProducts,
      activeProducts,
      totalInventoryValue,
      averagePrice,
      totalStock,
      lowStockCount,
      categoryStats,
      providerStats,
    };
  }, [dashboardData]);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="flex flex-row items-center gap-3">
            <HugeiconsIcon icon={Alert02Icon} className="size-6 text-destructive" />
            <div>
              <CardTitle className="text-destructive font-heading">Error al cargar estadísticas</CardTitle>
              <CardDescription className="text-destructive/80 font-mono text-xs">
                {error.message}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Asegúrate de que el servidor GraphQL esté ejecutándose en{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono">http://localhost:3000/graphql</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowStockProducts = (dashboardData as any)?.lowStockProducts || [];
  const recentProducts = (dashboardData as any)?.recentProducts || [];

  return (
    <div id="dashboard-pdf-content" className="flex flex-col gap-6 p-6 bg-background text-foreground animate-fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Panel de Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen general del inventario, almacén y distribución de valor en TechStore.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={exporting}
          data-html2canvas-ignore
          className="rounded-xl flex items-center gap-1.5 border-border hover:bg-muted"
        >
          <HugeiconsIcon icon={Download01Icon} className="size-4" />
          {exporting ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Inventory Value */}
        <Card className="relative overflow-hidden group border border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 size-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs uppercase font-semibold font-mono tracking-wider text-muted-foreground/80">
                Valor Total Almacén
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold mt-1">
                {loading ? <Skeleton className="h-9 w-32" /> : `$${stats.totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </CardTitle>
            </div>
            <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={CoinsIcon} className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Suma del costo total (precio × stock)
            </span>
          </CardContent>
        </Card>

        {/* Stock Total */}
        <Card className="relative overflow-hidden group border border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs uppercase font-semibold font-mono tracking-wider text-muted-foreground/80">
                Stock Total
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold mt-1">
                {loading ? <Skeleton className="h-9 w-24" /> : stats.totalStock.toLocaleString("en-US")}
              </CardTitle>
            </div>
            <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={StoreIcon} className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Unidades físicas totales disponibles
            </span>
          </CardContent>
        </Card>

        {/* Average Price */}
        <Card className="relative overflow-hidden group border border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 size-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs uppercase font-semibold font-mono tracking-wider text-muted-foreground/80">
                Precio Promedio
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold mt-1">
                {loading ? <Skeleton className="h-9 w-24" /> : `$${stats.averagePrice.toFixed(2)}`}
              </CardTitle>
            </div>
            <div className="size-11 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={DollarIcon} className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Precio unitario promedio del catálogo
            </span>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="relative overflow-hidden group border border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 size-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs uppercase font-semibold font-mono tracking-wider text-muted-foreground/80">
                Productos Registrados
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold mt-1">
                {loading ? <Skeleton className="h-9 w-20" /> : stats.totalProducts}
              </CardTitle>
            </div>
            <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={PackageIcon} className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <button
              onClick={() => navigate({ to: "/products" })}
              className="text-xs font-semibold text-purple-500 hover:text-purple-500/80 flex items-center gap-1 group/btn"
            >
              Ver todos los productos
              <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </button>
          </CardContent>
        </Card>

        {/* Active Products */}
        <Card className="relative overflow-hidden group border border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 size-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs uppercase font-semibold font-mono tracking-wider text-muted-foreground/80">
                Productos Activos
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold mt-1">
                {loading ? <Skeleton className="h-9 w-20" /> : stats.activeProducts}
              </CardTitle>
            </div>
            <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-550 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Estatus disponible para clientes
            </span>
          </CardContent>
        </Card>

        {/* Low Stock count */}
        <Card className="relative overflow-hidden group border border-border/50 bg-card/60 backdrop-blur-md hover:border-primary/30 transition-all duration-300 shadow-sm">
          <div className="absolute top-0 right-0 size-24 bg-destructive/5 rounded-full blur-2xl group-hover:bg-destructive/10 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs uppercase font-semibold font-mono tracking-wider text-muted-foreground/80">
                Alertas de Stock Bajo
              </CardDescription>
              <CardTitle className="text-3xl font-heading font-extrabold mt-1">
                {loading ? <Skeleton className="h-9 w-20" /> : stats.lowStockCount}
              </CardTitle>
            </div>
            <div className="size-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <HugeiconsIcon icon={Alert02Icon} className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <span className={cn(
              "text-[10px] font-semibold",
              stats.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {stats.lowStockCount > 0 ? "Se requiere reabastecimiento" : "Inventario estable"}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* --- Charts Section --- */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution Chart */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 text-primary">
              <HugeiconsIcon icon={TagIcon} className="size-4" />
              <CardTitle className="text-sm font-heading font-bold text-foreground">
                Valor de Inventario por Categoría
              </CardTitle>
            </div>
            <CardDescription className="text-xs">Distribución de costo y productos</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ) : stats.categoryStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No hay categorías registradas.</div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-1">
                <ChartContainer
                  config={categoryChartConfig}
                  style={{ height: `${Math.max(260, stats.categoryStats.length * 45)}px` }}
                  className="w-full aspect-auto"
                >
                  <BarChart
                    data={stats.categoryStats}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="categoryGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="oklch(0.7 0.15 220)" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                      tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 500 }}
                    />
                    <ChartTooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, _, item) => (
                            <div className="flex flex-col gap-0.5 min-w-[160px]">
                              <span className="font-bold text-foreground text-xs">{item.payload.name}</span>
                              <div className="flex justify-between text-[11px] mt-1 border-t border-border/40 pt-1">
                                <span className="text-muted-foreground">Valor Total:</span>
                                <span className="font-mono font-bold text-primary">
                                  ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Productos:</span>
                                <span className="font-mono text-muted-foreground">
                                  {item.payload.count} {item.payload.count === 1 ? "unidad" : "unidades"}
                                </span>
                              </div>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#categoryGrad)"
                      radius={[0, 6, 6, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Distribution Chart */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 text-purple-500">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4" />
              <CardTitle className="text-sm font-heading font-bold text-foreground">
                Valor de Inventario por Proveedor
              </CardTitle>
            </div>
            <CardDescription className="text-xs">Distribución de costo y productos</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ) : stats.providerStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No hay proveedores registrados.</div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-1">
                <ChartContainer
                  config={providerChartConfig}
                  style={{ height: `${Math.max(260, stats.providerStats.length * 45)}px` }}
                  className="w-full aspect-auto"
                >
                  <BarChart
                    data={stats.providerStats}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="providerGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="oklch(0.6 0.2 300)" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="oklch(0.7 0.15 320)" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={100}
                      tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 500 }}
                    />
                    <ChartTooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, _, item) => (
                            <div className="flex flex-col gap-0.5 min-w-[160px]">
                              <span className="font-bold text-foreground text-xs">{item.payload.name}</span>
                              <div className="flex justify-between text-[11px] mt-1 border-t border-border/40 pt-1">
                                <span className="text-muted-foreground">Valor Total:</span>
                                <span className="font-mono font-bold text-purple-500">
                                  ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Productos:</span>
                                <span className="font-mono text-muted-foreground">
                                  {item.payload.count} {item.payload.count === 1 ? "unidad" : "unidades"}
                                </span>
                              </div>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#providerGrad)"
                      radius={[0, 6, 6, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Low Stock Alert & Recent Additions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Products List */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-destructive">
                <HugeiconsIcon icon={Alert02Icon} className="size-4" />
                <CardTitle className="text-sm font-heading font-bold text-foreground">
                  Alertas de Stock Bajo
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Items con inventario crítico (&lt;= 5)</CardDescription>
            </div>
            <Badge variant="destructive" className="font-mono text-[10px] h-5">
              Urgente
            </Badge>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
                </div>
                Inventario saludable. No hay alertas críticas.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-y border-border/40 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider font-mono text-[9px]">
                      <th className="px-6 py-2.5">Producto</th>
                      <th className="px-4 py-2.5">Stock</th>
                      <th className="px-4 py-2.5">Precio</th>
                      <th className="px-6 py-2.5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p: any) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-foreground max-w-[200px] truncate">
                          {p.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "font-mono font-bold px-1.5 py-0.5 rounded",
                              p.stock <= 5
                                ? "text-destructive bg-destructive/10"
                                : "text-amber-500 bg-amber-500/10"
                            )}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">${p.price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-right">
                          <Badge
                            variant={
                              p.status === "ACTIVE"
                                ? "default"
                                : p.status === "INACTIVE"
                                ? "outline"
                                : "destructive"
                            }
                            className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0"
                          >
                            {p.status === "OUT_OF_STOCK" ? "Sin Stock" : p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Additions */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-primary">
                <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                <CardTitle className="text-sm font-heading font-bold text-foreground">
                  Productos Recientes
                </CardTitle>
              </div>
              <CardDescription className="text-xs">Últimos ingresos al almacén</CardDescription>
            </div>
            <button
              onClick={() => navigate({ to: "/products" })}
              className="text-xs font-semibold text-primary flex items-center gap-1.5 hover:underline"
            >
              Ver todos
            </button>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="px-6 py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <div className="size-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <HugeiconsIcon icon={HelpCircleIcon} className="size-5" />
                </div>
                No hay productos registrados aún.
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-y border-border/40 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider font-mono text-[9px]">
                      <th className="px-6 py-2.5">Producto</th>
                      <th className="px-4 py-2.5">Categoría</th>
                      <th className="px-4 py-2.5">Precio</th>
                      <th className="px-6 py-2.5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((p: any) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-foreground max-w-[200px] truncate">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.category?.name || "Sin Categoría"}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">${p.price.toFixed(2)}</td>
                        <td className="px-6 py-3 text-right">
                          <Badge
                            variant={
                              p.status === "ACTIVE"
                                ? "default"
                                : p.status === "INACTIVE"
                                ? "outline"
                                : "destructive"
                            }
                            className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0"
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
