"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/api";
import { systemConfigService } from "../services/system-config.service";
import type { ConfigFields } from "../types";

const queryKey = ["admin", "system-config"] as const;
const footerKey = ["system-config", "footer"] as const;

export function useFooterConfig() {
  return useQuery({
    queryKey: footerKey,
    queryFn: ({ signal }) => systemConfigService.getFooter(signal),
    staleTime: 60_000,
    retry: false,
  });
}

export function useSystemConfigs() {
  return useQuery({
    queryKey,
    queryFn: async () => (await systemConfigService.list()).data,
  });
}

export function useSaveSystemConfig() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ fields, editing }: { fields: ConfigFields; editing: boolean }) => {
      const { config_key, config_value, description } = fields;
      const payload = { config_value, description };
      if (editing) {
        await systemConfigService.update(config_key, payload);
      } else {
        await systemConfigService.create({ ...payload, config_key: config_key.trim() });
      }
    },
    onSuccess: async () => {
      toast.success("Đã lưu tham số cấu hình.");
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: footerKey }),
      ]);
    },
  });
}

export function useSeedFooterConfig() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => systemConfigService.seedFooter(),
    onSuccess: async () => {
      toast.success("Đã khởi tạo cấu hình chân trang.");
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: footerKey }),
      ]);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Không thể khởi tạo cấu hình chân trang.")),
  });
}
