import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import autoTable from "jspdf-autotable";

export interface ExcelColumnMapping {
  key: string;
  header: string;
  transform?: (val: any) => any;
}

export function exportToExcel(
  data: any[],
  fileName: string,
  mappings: ExcelColumnMapping[]
) {
  // Format the data according to the mappings
  const formattedData = data.map((item) => {
    const row: Record<string, any> = {};
    for (const mapping of mappings) {
      const parts = mapping.key.split(".");
      let val = item;
      for (const part of parts) {
        val = val?.[part];
      }
      row[mapping.header] = mapping.transform ? mapping.transform(val) : val;
    }
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

  // Autofit column widths
  const maxLengths = mappings.map((m) => m.header.length);
  formattedData.forEach((row) => {
    mappings.forEach((m, idx) => {
      const val = String(row[m.header] ?? "");
      if (val.length > maxLengths[idx]) {
        maxLengths[idx] = val.length;
      }
    });
  });

  worksheet["!cols"] = maxLengths.map((len) => ({ wch: len + 4 }));

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export async function exportElementToPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2, // high quality
    useCORS: true,
    backgroundColor: window.getComputedStyle(element).backgroundColor || "#0b0f19", // match dark/light theme background
  });

  const imgData = canvas.toDataURL("image/png");

  // Create PDF matching canvas dimensions to preserve dashboard layout without split pages
  const pdfWidth = canvas.width;
  const pdfHeight = canvas.height;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
    unit: "px",
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${fileName}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function generateExecutivePDFReport(data: {
  summary: {
    totalInventoryValue: number;
    totalStock: number;
    averagePrice: number;
    totalProducts: number;
    totalCategories: number;
    totalProviders: number;
  };
  categories: any[];
  providers: any[];
  products: any[];
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- BRAND COLORS (Typed as explicit tuples to satisfy jsPDF) ---
  const PRIMARY_COLOR: [number, number, number] = [11, 15, 25]; // Slate Dark
  const ACCENT_COLOR: [number, number, number] = [79, 70, 229]; // Indigo/Primary Brand
  const TEXT_MUTED: [number, number, number] = [107, 114, 128]; // Gray Muted

  // --- HEADER SECTION ---
  // Top decorative bar
  doc.setFillColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
  doc.rect(0, 0, pageWidth, 5, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("TECH STORE", 14, 20);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text("Reporte Ejecutivo de Inventario y Almacén", 14, 25);

  // Date and Metadata
  const dateStr = new Date().toLocaleString("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  });
  doc.text(`Generado: ${dateStr}`, pageWidth - 14, 20, { align: "right" });
  doc.text("Sistema: ERP/CRM TechStore Module", pageWidth - 14, 25, { align: "right" });

  // Horizontal divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  // --- SECTION 1: RESUMEN GENERAL ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("1. RESUMEN GENERAL DE INVENTARIO", 14, 39);

  // Draw a summary grid (table style)
  const summaryHeaders = [["Indicador", "Valor Registrado"]];
  const summaryBody = [
    ["Valor Total del Almacén (Precio × Stock)", `$${data.summary.totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
    ["Stock Físico Total de Unidades", `${data.summary.totalStock.toLocaleString("en-US")} unidades`],
    ["Precio Unitario Promedio", `$${data.summary.averagePrice.toFixed(2)}`],
    ["Total de Modelos de Productos", `${data.summary.totalProducts}`],
    ["Total de Categorías", `${data.summary.totalCategories}`],
    ["Total de Proveedores", `${data.summary.totalProviders}`],
  ];

  autoTable(doc, {
    startY: 42,
    head: summaryHeaders,
    body: summaryBody,
    theme: "striped",
    headStyles: { fillColor: ACCENT_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { font: "helvetica", fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 110 },
      1: { halign: "right", fontStyle: "bold" }
    },
    margin: { left: 14, right: 14 }
  });

  // --- SECTION 2: CATEGORÍAS ---
  let nextY = (doc as any).lastAutoTable.finalY + 12;

  if (nextY > pageHeight - 40) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("2. DISTRIBUCIÓN POR CATEGORÍAS", 14, nextY);

  const catHeaders = [["ID", "Nombre Categoría", "Cantidad de Productos", "Valor de Inventario"]];
  const catBody = data.categories.map((c) => [
    c.id || "-",
    c.name,
    `${c.count} prods`,
    `$${c.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  ]);

  const totalCatProducts = data.categories.reduce((sum, c) => sum + (c.count || 0), 0);
  const totalCatValue = data.categories.reduce((sum, c) => sum + (c.value || 0), 0);

  autoTable(doc, {
    startY: nextY + 3,
    head: catHeaders,
    body: catBody,
    foot: [
      [
        "",
        "Total",
        `${totalCatProducts} prods`,
        `$${totalCatValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { font: "helvetica", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "right" }
    },
    margin: { left: 14, right: 14 }
  });

  // --- SECTION 3: PROVEEDORES ---
  nextY = (doc as any).lastAutoTable.finalY + 12;

  if (nextY > pageHeight - 40) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("3. DISTRIBUCIÓN POR PROVEEDORES", 14, nextY);

  const provHeaders = [["ID", "Nombre Proveedor", "Cantidad de Productos", "Valor de Inventario"]];
  const provBody = data.providers.map((p) => [
    p.id || "-",
    p.name,
    `${p.count} prods`,
    `$${p.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  ]);

  const totalProvProducts = data.providers.reduce((sum, p) => sum + (p.count || 0), 0);
  const totalProvValue = data.providers.reduce((sum, p) => sum + (p.value || 0), 0);

  autoTable(doc, {
    startY: nextY + 3,
    head: provHeaders,
    body: provBody,
    foot: [
      [
        "",
        "Total",
        `${totalProvProducts} prods`,
        `$${totalProvValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
      ]
    ],
    theme: "grid",
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { font: "helvetica", fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "right" }
    },
    margin: { left: 14, right: 14 }
  });

  // --- SECTION 4: PRODUCTOS ---
  nextY = (doc as any).lastAutoTable.finalY + 12;

  if (nextY > pageHeight - 60) {
    doc.addPage();
    nextY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text("4. DETALLE DEL CATÁLOGO DE PRODUCTOS", 14, nextY);

  const prodHeaders = [["ID", "Nombre Producto", "Categoría", "Proveedor", "Precio", "Stock", "Estatus"]];
  const prodBody = data.products.map(p => [
    p.id,
    p.name,
    p.category?.name || "Sin Categoría",
    p.provider?.name || "Sin Proveedor",
    `$${p.price.toFixed(2)}`,
    p.stock.toString(),
    p.status
  ]);

  autoTable(doc, {
    startY: nextY + 3,
    head: prodHeaders,
    body: prodBody,
    theme: "striped",
    headStyles: { fillColor: ACCENT_COLOR, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { font: "helvetica", fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { fontStyle: "bold", cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { halign: "right" },
      5: { halign: "center" },
      6: { halign: "center" }
    },
    margin: { left: 14, right: 14 }
  });

  // Add Page Numbers Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: "right" });
    doc.text("Confidencial - TechStore ERP Internal Report", 14, pageHeight - 10);
  }

  doc.save(`Reporte_Inventario_General_${new Date().toISOString().split("T")[0]}.pdf`);
}
