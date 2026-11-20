export interface ExcelSheet { name: string; columns: string[]; rows: (string | number | boolean | null)[][]; }
export interface ExportStatisticsInput { filename: string; range: { startDate?: string; endDate?: string }; sheets: ExcelSheet[]; notes?: string[]; }

function exportFilename(input: ExportStatisticsInput, extension: "xlsx" | "csv") {
  const base = input.filename.replace(/\.xlsx?$/i, "");
  const suffix = input.range.startDate && input.range.endDate
    ? `_${input.range.startDate}_to_${input.range.endDate}`
    : "_all-time";
  return `${base}${suffix}.${extension}`;
}

export async function exportStatisticsExcel(input: ExportStatisticsInput) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const meta = workbook.addWorksheet("Thông tin");
  meta.addRows([["Khoảng thời gian", input.range.startDate && input.range.endDate ? `${input.range.startDate} đến ${input.range.endDate}` : "Toàn bộ thời gian"], ["Múi giờ", "Asia/Ho_Chi_Minh"], ["Thời điểm xuất (UTC)", new Date().toISOString()], ...(input.notes || []).map((note) => ["Ghi chú", note])]);
  for (const sheet of input.sheets) { const ws = workbook.addWorksheet(sheet.name); ws.addRow(sheet.columns); sheet.rows.forEach((row) => ws.addRow(row)); ws.getRow(1).font = { bold: true }; ws.columns.forEach((column, index) => { column.width = Math.min(Math.max((sheet.columns[index]?.length || 10) + 4, 12), 32); }); }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = exportFilename(input, "xlsx"); document.body.append(anchor); try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export function exportStatisticsCsv(input: ExportStatisticsInput) {
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const sections = [["Metadata", "Value"], ["Date range", input.range.startDate && input.range.endDate ? `${input.range.startDate} to ${input.range.endDate}` : "All time"], ["Timezone", "Asia/Ho_Chi_Minh"], ["Exported at (UTC)", new Date().toISOString()], ...(input.notes || []).map((note) => ["Note", note])];
  const rows: string[][] = sections.map((row) => row.map(String));
  for (const sheet of input.sheets) {
    rows.push([], [sheet.name], sheet.columns, ...sheet.rows.map((row) => row.map((value) => String(value ?? ""))));
  }
  const csv = "\uFEFF" + rows.map((row) => row.map(quote).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFilename(input, "csv");
  document.body.append(anchor);
  try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export function exportStatisticsData(input: ExportStatisticsInput, format: "xlsx" | "csv") {
  return format === "csv" ? exportStatisticsCsv(input) : exportStatisticsExcel(input);
}
