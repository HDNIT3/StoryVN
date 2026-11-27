import { exportStatisticsExcel, type DateRange, type ExcelSheet } from "@/components/statistics";
import { forumService } from "./forum.service";
import type { ForumPost, ForumPostStatus } from "../types";

export async function exportForum(scope: "me" | "admin", range: DateRange, status?: ForumPostStatus) {
  const items: ForumPost[] = [];
  for (let page = 1; ; page++) {
    const response = await forumService.list(scope, page, status, range, 100);
    if (!response.data) throw new Error("Không thể tải dữ liệu xuất.");
    items.push(...response.data.items);
    if (page >= response.data.pagination.totalPages) break;
  }
  const sheets: ExcelSheet[] = [
    { name: "Summary", columns: ["Metric", "Value"], rows: [["Matching posts", items.length], ["Visible", items.filter(p => p.status === "VISIBLE").length], ["Hidden", items.filter(p => p.status === "HIDDEN").length], ["Deleted", items.filter(p => p.status === "DELETED").length], ["Reports in period", items.reduce((n, p) => n + (p.reportCount ?? 0), 0)]] },
    { name: "Posts", columns: ["ID", "Title", "Author", "Status", "Created at", "Reports in period"], rows: items.map(p => [p._id, p.title, p.userId?.displayName || "", p.status, p.createdAt, p.reportCount ?? 0]) },
  ];
  if (scope === "me") {
    sheets[0].rows.pop();
    sheets[1].columns.pop();
    sheets[1].rows.forEach(row => row.pop());
  }
  if (scope === "admin") {
    const rows: ExcelSheet["rows"] = [];
    for (const post of items) {
      for (let page = 1; ; page++) {
        const response = await forumService.reports(post._id, page, range, 100);
        if (!response.data) throw new Error("Không thể tải báo cáo xuất.");
        rows.push(...response.data.items.map(r => [post._id, r._id, r.userId?.displayName || "", r.reason ?? "", r.createdAt]));
        if (page >= response.data.pagination.totalPages) break;
      }
    }
    sheets.push({ name: "Reports", columns: ["Post ID", "Report ID", "Reporter", "Reason", "Created at"], rows });
  }
  await exportStatisticsExcel({ filename: `${scope}-forum`, range, sheets, notes: [`Scope: ${scope}; status: ${status || "all"}. Posts filtered by createdAt; current status. Reports filtered by their own createdAt, for matching posts. Likes remain lifetime and are not period metrics.`] });
}
