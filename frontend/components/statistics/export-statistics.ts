export interface ExcelSheet { name: string; columns: string[]; rows: (string | number | boolean | null)[][]; }
export interface ExportStatisticsInput { filename: string; range: { startDate?: string; endDate?: string }; sheets: ExcelSheet[]; notes?: string[]; }

export async function exportStatisticsExcel(input: ExportStatisticsInput) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const meta = workbook.addWorksheet("Thông tin");
  meta.addRows([["Khoảng thời gian", input.range.startDate && input.range.endDate ? `${input.range.startDate} đến ${input.range.endDate}` : "Toàn bộ thời gian"], ["Múi giờ", "Asia/Ho_Chi_Minh"], ["Thời điểm xuất (UTC)", new Date().toISOString()], ...(input.notes || []).map((note) => ["Ghi chú", note])]);
  for (const sheet of input.sheets) { const ws = workbook.addWorksheet(sheet.name); ws.addRow(sheet.columns); sheet.rows.forEach((row) => ws.addRow(row)); ws.getRow(1).font = { bold: true }; ws.columns.forEach((column, index) => { column.width = Math.min(Math.max((sheet.columns[index]?.length || 10) + 4, 12), 32); }); }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = input.filename.endsWith(".xlsx") ? input.filename : `${input.filename}.xlsx`; document.body.append(anchor); try { anchor.click(); } finally { anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
