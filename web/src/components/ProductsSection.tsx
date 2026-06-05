import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  GET_PRODUCTS,
  GET_CATEGORIES_FOR_SELECT,
  GET_PROVIDERS_FOR_SELECT,
  CREATE_PRODUCT,
  UPDATE_PRODUCT,
  DELETE_PRODUCT,
  ACTIVATE_PRODUCT,
  DEACTIVATE_PRODUCT,
  GET_DASHBOARD_DATA,
} from "@/graphql/operations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Add01Icon,
  PencilIcon,
  Delete01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { exportToExcel } from "@/lib/export";
import { cn } from "@/lib/utils";

export function ProductsSection() {
  const [exporting, setExporting] = useState(false);
  const client = useApolloClient();

  // --- Query Params State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  
  // Sorting
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(0);
  const limit = 10;

  // --- Form & Dialog States ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    status: "ACTIVE",
    categoryId: "",
    providerId: "",
  });

  // --- Search Debounce Optimization ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // --- GraphQL Queries ---
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    variables: {
      search: debouncedSearch || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      limit,
      offset: page * limit,
      orderBy: orderBy as any,
      sortOrder: sortOrder as any,
    },
    fetchPolicy: "cache-and-network",
  });

  // Categories & Providers dropdown options
  const { data: categoriesData } = useQuery(GET_CATEGORIES_FOR_SELECT, {
    variables: { limit: 100 },
  });
  const { data: providersData } = useQuery(GET_PROVIDERS_FOR_SELECT, {
    variables: { limit: 100 },
  });

  // --- GraphQL Mutations ---
  const refetchQueriesList = [
    {
      query: GET_PRODUCTS,
      variables: {
        search: debouncedSearch || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        limit,
        offset: page * limit,
        orderBy: orderBy as any,
        sortOrder: sortOrder as any,
      },
    },
    { query: GET_DASHBOARD_DATA },
  ];

  // 1. Create Product
  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT, {
    refetchQueries: refetchQueriesList,
    onCompleted: () => {
      toast.success("Producto creado con éxito");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`Error al crear producto: ${err.message}`);
    },
  });

  // 2. Update Product
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: refetchQueriesList,
    onCompleted: () => {
      toast.success("Producto actualizado con éxito");
      setIsEditOpen(false);
      setSelectedProduct(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(`Error al actualizar producto: ${err.message}`);
    },
  });

  // 3. Delete Product
  const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: refetchQueriesList,
    onCompleted: () => {
      toast.success("Producto eliminado con éxito");
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (err: any) => {
      toast.error(`Error al eliminar producto: ${err.message}`);
    },
  });

  // 4. Activate/Deactivate
  const [activateProduct] = useMutation(ACTIVATE_PRODUCT, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    onCompleted: () => toast.success("Producto activado"),
    onError: (err: any) => toast.error(err.message),
  });

  const [deactivateProduct] = useMutation(DEACTIVATE_PRODUCT, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA }],
    onCompleted: () => toast.success("Producto desactivado"),
    onError: (err: any) => toast.error(err.message),
  });

  // --- Handlers ---
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const { data } = await client.query<any>({
        query: GET_PRODUCTS,
        variables: {
          search: debouncedSearch || undefined,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          limit: -1,
          orderBy: orderBy as any,
          sortOrder: sortOrder as any,
        },
        fetchPolicy: "network-only",
      });

      const productsToExport = data?.products || [];
      if (productsToExport.length === 0) {
        toast.error("No hay productos para exportar");
        return;
      }

      exportToExcel(
        productsToExport,
        "Productos",
        [
          { key: "id", header: "ID" },
          { key: "name", header: "Nombre" },
          { key: "price", header: "Precio", transform: (v) => `$${(v || 0).toFixed(2)}` },
          { key: "stock", header: "Stock" },
          { key: "status", header: "Estatus" },
          { key: "category.name", header: "Categoría" },
          { key: "provider.name", header: "Proveedor" },
        ]
      );
      toast.success("Productos exportados a Excel");
    } catch (err: any) {
      toast.error(`Error al exportar: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      status: "ACTIVE",
      categoryId: "",
      providerId: "",
    });
  };

  const handleOpenEdit = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      status: product.status,
      categoryId: product.category?.id || "",
      providerId: product.provider?.id || "",
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock || !formData.categoryId || !formData.providerId) {
      toast.warning("Por favor completa todos los campos requeridos");
      return;
    }

    createProduct({
      variables: {
        input: {
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
          status: formData.status as any,
          categoryId: parseInt(formData.categoryId, 10),
          providerId: parseInt(formData.providerId, 10),
        },
      },
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    updateProduct({
      variables: {
        input: {
          id: parseInt(selectedProduct.id, 10),
          name: formData.name || undefined,
          price: formData.price ? parseFloat(formData.price) : undefined,
          stock: formData.stock ? parseInt(formData.stock, 10) : undefined,
          status: formData.status as any,
          categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : undefined,
          providerId: formData.providerId ? parseInt(formData.providerId, 10) : undefined,
        },
      },
    });
  };

  const handleToggleStatus = (product: any) => {
    const productId = parseInt(product.id, 10);
    if (product.status === "ACTIVE") {
      deactivateProduct({
        variables: { id: productId },
        optimisticResponse: {
          deactivateProduct: {
            __typename: "Product",
            id: product.id,
            status: "INACTIVE",
          },
        },
      });
    } else {
      activateProduct({
        variables: { id: productId },
        optimisticResponse: {
          activateProduct: {
            __typename: "Product",
            id: product.id,
            status: "ACTIVE",
          },
        },
      });
    }
  };

  const handleSort = (field: string) => {
    if (orderBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(field);
      setSortOrder("asc");
    }
    setPage(0);
  };

  // --- Calculations ---
  const products = (data as any)?.products || [];
  const totalProductsCount = (data as any)?.totalProducts || 0;
  const totalPages = Math.ceil(totalProductsCount / limit);

  // --- TanStack Table Setup ---
  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: () => (
        <span 
          className="cursor-pointer select-none flex items-center gap-1.5 hover:text-foreground transition-colors"
          onClick={() => handleSort("id")}
        >
          ID {orderBy === "id" && (sortOrder === "asc" ? "▲" : "▼")}
        </span>
      ),
      cell: (info) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("name", {
      header: () => (
        <span 
          className="cursor-pointer select-none flex items-center gap-1.5 hover:text-foreground transition-colors"
          onClick={() => handleSort("name")}
        >
          Nombre {orderBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
        </span>
      ),
      cell: (info) => (
        <span className="font-semibold text-foreground max-w-[200px] truncate">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("price", {
      header: () => (
        <span 
          className="cursor-pointer select-none flex items-center gap-1.5 hover:text-foreground transition-colors"
          onClick={() => handleSort("price")}
        >
          Precio {orderBy === "price" && (sortOrder === "asc" ? "▲" : "▼")}
        </span>
      ),
      cell: (info) => (
        <span className="font-mono font-semibold text-foreground">
          ${info.getValue().toFixed(2)}
        </span>
      ),
    }),
    columnHelper.accessor("stock", {
      header: () => (
        <span 
          className="cursor-pointer select-none flex items-center gap-1.5 hover:text-foreground transition-colors"
          onClick={() => handleSort("stock")}
        >
          Stock {orderBy === "stock" && (sortOrder === "asc" ? "▲" : "▼")}
        </span>
      ),
      cell: (info) => {
        const stock = info.getValue();
        return (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded font-bold font-mono text-xs",
              stock <= 5
                ? "text-destructive bg-destructive/10"
                : stock <= 15
                ? "text-amber-500 bg-amber-500/10"
                : "text-muted-foreground bg-muted/40"
            )}
          >
            {stock}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "inventoryValue",
      header: () => <span className="font-semibold text-foreground">Valor Inventario</span>,
      cell: (info) => {
        const product = info.row.original;
        const value = product.price * product.stock;
        return (
          <span className="font-mono font-semibold text-primary">
            ${value.toFixed(2)}
          </span>
        );
      },
    }),
    columnHelper.accessor("category.name", {
      header: "Categoría",
      cell: (info) => info.getValue() || <span className="italic text-[10px] text-muted-foreground">Ninguna</span>,
    }),
    columnHelper.accessor("provider.name", {
      header: "Proveedor",
      cell: (info) => info.getValue() || <span className="italic text-[10px] text-muted-foreground">Ninguno</span>,
    }),
    columnHelper.accessor("status", {
      header: () => (
        <span 
          className="cursor-pointer select-none flex items-center gap-1.5 hover:text-foreground transition-colors"
          onClick={() => handleSort("status")}
        >
          Estado {orderBy === "status" && (sortOrder === "asc" ? "▲" : "▼")}
        </span>
      ),
      cell: (info) => {
        const status = info.getValue();
        const product = info.row.original;
        return (
          <Badge
            variant={
              status === "ACTIVE"
                ? "default"
                : status === "INACTIVE"
                ? "outline"
                : "destructive"
            }
            className="cursor-pointer select-none text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 transition-transform hover:scale-105 active:scale-95"
            onClick={() => handleToggleStatus(product)}
            title="Click para alternar estado Activo/Inactivo"
          >
            {status === "OUT_OF_STOCK" ? "Sin Stock" : status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: (info) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => handleOpenEdit(info.row.original)}
            className="rounded-lg text-muted-foreground hover:text-primary hover:border-primary/40"
            title="Editar"
          >
            <HugeiconsIcon icon={PencilIcon} className="size-3.5" />
          </Button>
          <Button
            variant="destructive"
            size="icon-xs"
            onClick={() => handleOpenDelete(info.row.original)}
            className="rounded-lg"
            title="Eliminar"
          >
            <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
          </Button>
        </div>
      ),
    }),
  ], [orderBy, sortOrder]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Productos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de inventario de productos y estado de disponibilidad.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={exporting}
            className="rounded-xl flex items-center gap-1.5 border-border hover:bg-muted"
          >
            <HugeiconsIcon icon={Download01Icon} className="size-4" />
            {exporting ? "Exportando..." : "Exportar Excel"}
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Filters Box */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl border-border/70"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
              <SelectTrigger className="rounded-xl border-border/70">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los Estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Sin Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Min Price Filter */}
            <Input
              type="number"
              placeholder="Precio Mín."
              value={minPrice}
              onChange={(e: any) => { setMinPrice(e.target.value); setPage(0); }}
              className="rounded-xl border-border/70 font-mono"
            />

            {/* Max Price Filter */}
            <Input
              type="number"
              placeholder="Precio Máx."
              value={maxPrice}
              onChange={(e: any) => { setMaxPrice(e.target.value); setPage(0); }}
              className="rounded-xl border-border/70 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main List */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-y border-border/40 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider font-mono text-[9px]"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-3">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-border/40">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-6" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-destructive font-semibold">
                      Error al cargar los productos.
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-10 text-center text-muted-foreground font-medium">
                      No se encontraron productos coincidentes.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 hover:bg-muted/25 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-3.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border/40">
              <span className="text-[11px] font-mono text-muted-foreground">
                Página {page + 1} de {totalPages} ({totalProductsCount} productos)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg text-xs"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg text-xs"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- CREATE DIALOG --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px] border-border bg-card/95 backdrop-blur-lg">
          <form onSubmit={handleSaveCreate}>
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-foreground">Crear Nuevo Producto</DialogTitle>
              <DialogDescription className="text-xs">
                Registra un nuevo producto en la tienda. Todos los campos marcados con * son obligatorios.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              {/* Product Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                  NOMBRE PRODUCTO *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Intel Core i9-14900K"
                  className="rounded-lg"
                />
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    PRECIO ($ USD) *
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="549.99"
                    className="rounded-lg font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    CANTIDAD STOCK *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e: any) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Category & Provider Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    CATEGORÍA *
                  </label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(categoriesData as any)?.categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    PROVEEDOR *
                  </label>
                  <Select
                    value={formData.providerId}
                    onValueChange={(val) => setFormData({ ...formData, providerId: val })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(providersData as any)?.providers.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Initial Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                  ESTADO INICIAL
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Sin Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-lg">
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="rounded-lg">
                {creating ? "Creando..." : "Crear Producto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px] border-border bg-card/95 backdrop-blur-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-foreground">Editar Producto</DialogTitle>
              <DialogDescription className="text-xs">
                Modifica los datos del producto seleccionado.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              {/* Product Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                  NOMBRE PRODUCTO
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-lg"
                />
              </div>

              {/* Price & Stock Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    PRECIO ($ USD)
                  </label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e: any) => setFormData({ ...formData, price: e.target.value })}
                    className="rounded-lg font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    CANTIDAD STOCK
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e: any) => setFormData({ ...formData, stock: e.target.value })}
                    className="rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Category & Provider Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    CATEGORÍA
                  </label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(categoriesData as any)?.categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                    PROVEEDOR
                  </label>
                  <Select
                    value={formData.providerId}
                    onValueChange={(val) => setFormData({ ...formData, providerId: val })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(providersData as any)?.providers.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                  ESTADO
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Sin Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-lg">
                Cancelar
              </Button>
              <Button type="submit" disabled={updating} className="rounded-lg">
                {updating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE DIALOG --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card/95 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={Delete01Icon} className="size-5" />
              ¿Confirmar Eliminación?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Estás a punto de eliminar permanentemente el producto{" "}
              <strong className="text-foreground font-semibold">"{selectedProduct?.name}"</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="rounded-lg">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                if (selectedProduct) {
                  deleteProduct({
                    variables: { id: parseInt(selectedProduct.id, 10) },
                  });
                }
              }}
              className="rounded-lg"
            >
              {deleting ? "Eliminando..." : "Eliminar Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
