export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string }[]
) {
  if (data.length === 0) {
    return;
  }

  const headers = columns.map(col => `"${String(col.header).replace(/"/g, '""')}"`);
  const rows = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockCountPDFRow {
  category: string;
  department: string;
  item_name: string;
  unit_of_measure: string;
  qty_received: number;
  opening_stock: number;
  qty_issued: number;
  qty_transferred: number;
  sold: number;
  damages: number;
  balance: number;
  phy_count: number | null;
  variance: number | null;
  unit_cost: number;
  variance_value: number | null;
  comment: string;
  status: 'out' | 'low' | 'healthy';
}

export interface StockCountPDFMeta {
  dateStart: string;
  dateEnd: string;
  branchName?: string;
  department: string;
  summary: { out: number; low: number; healthy: number };
}

// ─── PDF colours ──────────────────────────────────────────────────────────────

const BRAND_DARK: [number, number, number] = [30, 30, 60];
const BRAND_PRIMARY: [number, number, number] = [79, 70, 229];  // indigo-600
const CATEGORY_BG: [number, number, number] = [240, 240, 250];
const ROW_OUT: [number, number, number] = [254, 226, 226];       // red-100
const ROW_LOW: [number, number, number] = [254, 243, 199];       // amber-100
const TEXT_OUT: [number, number, number] = [185, 28, 28];        // red-700
const TEXT_LOW: [number, number, number] = [146, 64, 14];        // amber-800
const GREY: [number, number, number] = [100, 100, 100];

// ─── Main function ─────────────────────────────────────────────────────────────

export async function exportStockCountToPDF(
  rows: StockCountPDFRow[],
  meta: StockCountPDFMeta
): Promise<void> {
  if (rows.length === 0) return;

  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Header ─────────────────────────────────────────────────────────────────

  // App name
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'bold');
  doc.text('USESTOCKIST', 14, 12);

  // Report title
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_DARK);
  doc.text('Reconciled Stock Count', 14, 21);

  // Metadata line
  const periodLabel = meta.dateStart === meta.dateEnd
    ? meta.dateStart
    : `${meta.dateStart} → ${meta.dateEnd}`;
  const deptLabel = meta.department === 'all' ? 'All Departments' : meta.department;
  const branchLabel = meta.branchName ? `Branch: ${meta.branchName}` : '';
  const metaParts = [periodLabel, branchLabel, `Dept: ${deptLabel}`].filter(Boolean).join('   |   ');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GREY);
  doc.text(metaParts, 14, 27);

  // Generated timestamp (right-aligned)
  doc.text(`Generated: ${now}`, pageWidth - 14, 12, { align: 'right' });

  // ── KPI summary pills ───────────────────────────────────────────────────────

  const pillY = 33;
  const pillH = 7;

  // 🔴 Out
  doc.setFillColor(...TEXT_OUT);
  doc.roundedRect(14, pillY, 38, pillH, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`🔴  Out of Stock: ${meta.summary.out}`, 18, pillY + 4.8);

  // 🟡 Low
  doc.setFillColor(146, 64, 14);
  doc.roundedRect(56, pillY, 38, pillH, 1.5, 1.5, 'F');
  doc.text(`🟡  Low Stock: ${meta.summary.low}`, 60, pillY + 4.8);

  // 🟢 OK
  doc.setFillColor(21, 128, 61);
  doc.roundedRect(98, pillY, 38, pillH, 1.5, 1.5, 'F');
  doc.text(`🟢  Healthy: ${meta.summary.healthy}`, 102, pillY + 4.8);

  doc.setTextColor(...BRAND_DARK);

  // Divider
  const divY = pillY + pillH + 3;
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(14, divY, pageWidth - 14, divY);

  // ── Build table data ────────────────────────────────────────────────────────

  const columns = [
    { header: 'Item', dataKey: 'item' },
    { header: 'Dept', dataKey: 'dept' },
    { header: 'Rcvd', dataKey: 'rcvd' },
    { header: 'Opening', dataKey: 'opening' },
    { header: 'Issued', dataKey: 'issued' },
    { header: 'Transfer', dataKey: 'transfer' },
    { header: 'Sold', dataKey: 'sold' },
    { header: 'Dmg', dataKey: 'dmg' },
    { header: 'Balance', dataKey: 'balance' },
    { header: 'Phy. Cnt', dataKey: 'phy' },
    { header: 'Variance', dataKey: 'variance' },
    { header: 'Unit Cost', dataKey: 'cost' },
    { header: 'Var. Value', dataKey: 'varval' },
    { header: 'Comment', dataKey: 'comment' },
  ];

  // Group rows by category — inject a "section header" pseudo-row
  const sortedRows = [...rows].sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    const pri = { out: 2, low: 1, healthy: 0 } as const;
    if (pri[a.status] !== pri[b.status]) return pri[b.status] - pri[a.status];
    return a.item_name.localeCompare(b.item_name);
  });

  type BodyRow = { _type: 'data'; row: StockCountPDFRow } | { _type: 'cat'; label: string };
  const bodyRows: BodyRow[] = [];
  let lastCat = '';
  for (const row of sortedRows) {
    if (row.category !== lastCat) {
      const catCount = sortedRows.filter(r => r.category === row.category).length;
      bodyRows.push({ _type: 'cat', label: `${row.category}  (${catCount})` });
      lastCat = row.category;
    }
    bodyRows.push({ _type: 'data', row });
  }

  const tableBody = bodyRows.map(entry => {
    if (entry._type === 'cat') {
      return [{ content: entry.label, colSpan: columns.length, _isCatHeader: true }];
    }
    const r = entry.row;
    return [
      `${r.status === 'out' ? '🔴 ' : r.status === 'low' ? '🟡 ' : ''}${r.item_name}\n${r.unit_of_measure}`,
      r.department,
      String(r.qty_received),
      String(r.opening_stock),
      String(r.qty_issued),
      String(r.qty_transferred),
      String(r.sold),
      String(r.damages),
      String(r.balance),
      r.phy_count !== null ? String(r.phy_count) : '—',
      r.variance !== null ? String(r.variance) : '—',
      `₦${(Number(r.unit_cost) || 0).toFixed(2)}`,
      r.variance_value !== null ? `₦${r.variance_value.toFixed(2)}` : '—',
      r.comment || '',
    ];
  });

  // ── Render table ────────────────────────────────────────────────────────────

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: tableBody as Parameters<typeof autoTable>[1]['body'],
    startY: divY + 4,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
      lineColor: [210, 210, 225],
    },
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 38 },  // Item
      1: { cellWidth: 14, halign: 'center' },  // Dept
      2: { cellWidth: 12, halign: 'right' },   // Rcvd
      3: { cellWidth: 14, halign: 'right' },   // Opening
      4: { cellWidth: 12, halign: 'right' },   // Issued
      5: { cellWidth: 14, halign: 'right' },   // Transfer
      6: { cellWidth: 12, halign: 'right' },   // Sold
      7: { cellWidth: 10, halign: 'right' },   // Dmg
      8: { cellWidth: 14, halign: 'right' },   // Balance
      9: { cellWidth: 14, halign: 'right' },   // Phy Cnt
      10: { cellWidth: 14, halign: 'right' },  // Variance
      11: { cellWidth: 18, halign: 'right' },  // Unit Cost
      12: { cellWidth: 18, halign: 'right' },  // Var Value
      13: { cellWidth: 'auto' },               // Comment
    },
    didParseCell(data) {
      const raw = data.row.raw as unknown[];
      // Category header rows
      if (
        Array.isArray(raw) &&
        raw.length === 1 &&
        typeof raw[0] === 'object' &&
        raw[0] !== null &&
        '_isCatHeader' in (raw[0] as object)
      ) {
        data.cell.styles.fillColor = CATEGORY_BG;
        data.cell.styles.textColor = BRAND_DARK;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 8;
        return;
      }

      if (data.section !== 'body') return;

      // Find the matching source row by index, skipping category header rows
      let dataRowIdx = 0;
      let tableRowIdx = 0;
      let targetRow: StockCountPDFRow | undefined;
      for (const entry of bodyRows) {
        if (entry._type === 'cat') { tableRowIdx++; continue; }
        if (tableRowIdx === data.row.index) { targetRow = entry.row; break; }
        tableRowIdx++;
        dataRowIdx++;
      }

      if (!targetRow) return;

      if (targetRow.status === 'out') {
        data.cell.styles.fillColor = ROW_OUT;
        if (data.column.index === 8) {
          data.cell.styles.textColor = TEXT_OUT;
          data.cell.styles.fontStyle = 'bold';
        }
      } else if (targetRow.status === 'low') {
        data.cell.styles.fillColor = ROW_LOW;
        if (data.column.index === 8) {
          data.cell.styles.textColor = TEXT_LOW;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    // Page number footer
    didDrawPage(data) {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(...GREY);
      doc.setFont('helvetica', 'normal');
      const footY = doc.internal.pageSize.getHeight() - 6;
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - 14,
        footY,
        { align: 'right' }
      );
      doc.text('USESTOCKIST — Stock Count Report', 14, footY);
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const filename = `stock_count_${meta.dateStart}_to_${meta.dateEnd}_${today}.pdf`;
  doc.save(filename);
}
