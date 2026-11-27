import { api, API_BASE_URL } from "@/lib/api";
import type { ConfigEntry, ConfigFields, FooterConfig } from "../types";

const endpoint = "/admin/system-config";

export const systemConfigService = {
  list: () => api.get<{ data: ConfigEntry[] }>(endpoint),
  create: (payload: ConfigFields) => api.post(endpoint, payload),
  seedFooter: () => api.post(`${endpoint}/seed-footer`),
  update: (key: string, payload: Omit<ConfigFields, "config_key">) =>
    api.patch(`${endpoint}/${encodeURIComponent(key)}`, payload),
  async getFooter(signal: AbortSignal) {
    const response = await fetch(`${API_BASE_URL}/system-config/footer`, { signal });
    if (!response.ok) throw new Error("Không thể tải cấu hình chân trang.");
    const { data }: { data: FooterConfig } = await response.json();
    return data;
  },
};
