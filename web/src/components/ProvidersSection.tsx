import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  GET_PROVIDERS,
  CREATE_PROVIDER,
  UPDATE_PROVIDER,
  DELETE_PROVIDER,
  GET_PRODUCTS,
  GET_DASHBOARD_DATA,
} from "@/graphql/operations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserGroupIcon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { exportToExcel } from "@/lib/export";

export function ProvidersSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const client = useApolloClient();
  
  // Sorting & Pagination
  const [orderBy, setOrderBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const limit = 10;

  // Dialog & Form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [providerName, setProviderName] = useState("");

  // Search Debounce Optimization
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Query
  const { data, loading, error } = useQuery(GET_PROVIDERS, {
    variables: {
      search: debouncedSearch || undefined,
      limit,
      offset: page * limit,
      orderBy: orderBy as any,
      sortOrder: sortOrder as any,
    },
    fetchPolicy: "cache-and-network",
  });

  const refetchQueriesList = [
    {
      query: GET_PROVIDERS,
      variables: {
        search: debouncedSearch || undefined,
        limit,
        offset: page * limit,
        orderBy: orderBy as any,
        sortOrder: sortOrder as any,
      },
    },
    { query: GET_PRODUCTS },
    { query: GET_DASHBOARD_DATA },
  ];

  // Mutations
  const [createProvider, { loading: creating }] = useMutation(CREATE_PROVIDER, {
    refetchQueries: refetchQueriesList,
    onCompleted: () => {
      toast.success("Proveedor creado");
      setIsCreateOpen(false);
      setProviderName("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [updateProvider, { loading: updating }] = useMutation(UPDATE_PROVIDER, {
    refetchQueries: refetchQueriesList,
    onCompleted: () => {
      toast.success("Proveedor actualizado");
      setIsEditOpen(false);
      setSelectedProvider(null);
      setProviderName("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [deleteProvider, { loading: deleting }] = useMutation(DELETE_PROVIDER, {
    refetchQueries: refetchQueriesList,
    onCompleted: () => {
      toast.success("Proveedor eliminado");
      setIsDeleteOpen(false);
      setSelectedProvider(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Handlers
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const { data } = await client.query<any>({
        query: GET_PROVIDERS,
        variables: {
          search: debouncedSearch || undefined,
          limit: -1,
          orderBy: orderBy as any,
          sortOrder: sortOrder as any,
        },
        fetchPolicy: "network-only",
      });

      const providersToExport = data?.providers || [];
      if (providersToExport.length === 0) {
        toast.error("No hay proveedores para exportar");
        return;
      }

      exportToExcel(
        providersToExport,
        "Proveedores",
        [
          { key: "id", header: "ID" },
          { key: "name", header: "Nombre" },
          { key: "totalProducts", header: "Cantidad de Productos" },
          { key: "inventoryValue", header: "Valor de Inventario", transform: (v) => `$${(v || 0).toFixed(2)}` },
        ]
      );
      toast.success("Proveedores exportados a Excel");
    } catch (err: any) {
      toast.error(`Error al exportar: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerName.trim()) return;
    createProvider({
      variables: { input: { name: providerName.trim() } },
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !providerName.trim()) return;
    updateProvider({
      variables: {
        input: {
          id: parseInt(selectedProvider.id, 10),
          name: providerName.trim(),
        },
      },
    });
  };

  const handleOpenEdit = (provider: any) => {
    setSelectedProvider(provider);
    setProviderName(provider.name);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (provider: any) => {
    setSelectedProvider(provider);
    setIsDeleteOpen(true);
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

  const providers = (data as any)?.providers || [];
  const totalCount = (data as any)?.totalProviders || 0;
  const totalPages = Math.ceil(totalCount / limit);

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
          Nombre Proveedor {orderBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
        </span>
      ),
      cell: (info) => (
        <span className="font-semibold text-foreground flex items-center gap-2">
          <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />
          </div>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "productCount",
      header: "Cantidad de Productos",
      cell: (info) => {
        const count = info.row.original.totalProducts ?? 0;
        return <span className="font-mono font-medium">{count}</span>;
      },
    }),
    columnHelper.display({
      id: "inventoryValue",
      header: "Valor de Inventario",
      cell: (info) => {
        const value = info.row.original.inventoryValue ?? 0;
        return (
          <span className="font-mono font-semibold text-primary">
            ${value.toFixed(2)}
          </span>
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
    data: providers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Proveedores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los socios de suministro de tus mercancías.
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
              setProviderName("");
              setIsCreateOpen(true);
            }}
            className="rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proveedor por nombre..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl border-border/70"
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
                    <tr key={idx} className="border-b border-border/40 animate-pulse">
                      <td className="px-6 py-4"><Skeleton className="h-4 w-6" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-destructive font-semibold">
                      Error al cargar los proveedores.
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-10 text-center text-muted-foreground font-medium">
                      No se encontraron proveedores.
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
                Página {page + 1} de {totalPages} ({totalCount} proveedores)
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
        <DialogContent className="sm:max-w-[400px] border-border bg-card/95 backdrop-blur-lg">
          <form onSubmit={handleSaveCreate}>
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-foreground">Crear Proveedor</DialogTitle>
              <DialogDescription className="text-xs">
                Añade un nuevo distribuidor de mercancías.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1 py-4">
              <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                NOMBRE DE PROVEEDOR *
              </label>
              <Input
                required
                value={providerName}
                onChange={(e: any) => setProviderName(e.target.value)}
                placeholder="ej. AMD, Corsair, Kingston"
                className="rounded-lg"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-lg">
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="rounded-lg">
                {creating ? "Creando..." : "Crear Proveedor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[400px] border-border bg-card/95 backdrop-blur-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-foreground">Editar Proveedor</DialogTitle>
              <DialogDescription className="text-xs">
                Modifica el nombre del proveedor seleccionado.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1 py-4">
              <label className="text-[11px] font-mono font-semibold text-muted-foreground">
                NOMBRE DE PROVEEDOR
              </label>
              <Input
                required
                value={providerName}
                onChange={(e: any) => setProviderName(e.target.value)}
                className="rounded-lg"
              />
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
              ¿Estás seguro de eliminar el proveedor <strong className="text-foreground">"{selectedProvider?.name}"</strong>? Los productos asociados perderán su proveedor asignado.
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
                if (selectedProvider) {
                  deleteProvider({
                    variables: { id: parseInt(selectedProvider.id, 10) },
                  });
                }
              }}
              className="rounded-lg"
            >
              {deleting ? "Eliminando..." : "Eliminar Proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
