"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { useSaveSystemConfig, useSeedFooterConfig, useSystemConfigs } from "../queries/useSystemConfigQueries";
import type { ConfigFields } from "../types";

const emptyFields: ConfigFields = { config_key: "", config_value: "", description: "" };
const keyPattern = "[A-Za-z][A-Za-z0-9_.\\-]{0,79}";
const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100";
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export function AdminSystemConfigView() {
  const [fields, setFields] = useState(emptyFields);
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const configs = useSystemConfigs();
  const save = useSaveSystemConfig();
  const seedFooter = useSeedFooterConfig();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate({ fields, editing }, {
      onSuccess: () => {
        setFields(emptyFields);
        setEditing(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{editing ? "Cập nhật tham số" : "Thêm tham số"}</h2>
        <fieldset disabled={save.isPending} className="space-y-4">
          <label className="block text-sm font-medium">
            Khóa cấu hình
            <input required readOnly={editing} maxLength={80} pattern={keyPattern}
              value={fields.config_key} className={fieldClass} placeholder="support.email"
              onChange={(event) => setFields({ ...fields, config_key: event.target.value })} />
            <span className="mt-1 block text-xs text-slate-500">
              Bắt đầu bằng chữ cái. Dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.
            </span>
          </label>
          <label className="block text-sm font-medium">
            Giá trị
            <textarea rows={3} maxLength={4000} value={fields.config_value} className={fieldClass}
              onChange={(event) => setFields({ ...fields, config_value: event.target.value })} />
          </label>
          <label className="block text-sm font-medium">
            Mô tả
            <textarea rows={2} maxLength={500} value={fields.description} className={fieldClass}
              onChange={(event) => setFields({ ...fields, description: event.target.value })} />
          </label>
          {save.isError && <p role="alert" className="text-sm text-red-700">
            {getApiErrorMessage(save.error, "Không thể lưu tham số cấu hình.")}
          </p>}
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {save.isPending ? "Đang lưu…" : "Lưu cấu hình"}
            </button>
            {editing && <button type="button" className="rounded-lg border px-4 py-2 text-sm"
              onClick={() => { setFields(emptyFields); setEditing(false); save.reset(); }}>Hủy</button>}
          </div>
        </fieldset>
      </form>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Các tham số cấu hình</h2>
          <button type="button" disabled={seedFooter.isPending} onClick={() => seedFooter.mutate()}
            className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50">
            {seedFooter.isPending ? "Đang khởi tạo…" : "Khởi tạo cấu hình chân trang"}
          </button>
        </div>
        {configs.isPending && <p role="status" className="p-5 text-sm">Đang tải cấu hình…</p>}
        {configs.isError && <div className="p-5 text-sm">
          <p role="alert">{getApiErrorMessage(configs.error, "Không thể tải cấu hình.")}</p>
          <button type="button" onClick={() => void configs.refetch()} className="mt-2 text-indigo-700 underline">Thử lại</button>
        </div>}
        {configs.data?.length === 0 && <p className="p-5 text-sm text-slate-600">Chưa có tham số cấu hình.</p>}
        {!!configs.data?.length && <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left text-sm">
            <thead className="bg-slate-50"><tr>
              <th scope="col" className="w-1/5 p-3">Khóa</th>
              <th scope="col" className="w-1/4 p-3">Giá trị</th>
              <th scope="col" className="w-1/4 p-3">Mô tả</th>
              <th scope="col" className="w-1/5 p-3">Cập nhật</th>
              <th scope="col" className="p-3">Thao tác</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200">
              {configs.data.map((entry) => (
                <tr key={entry.config_key}>
                  <th scope="row" className="break-all p-3 align-top font-medium">{entry.config_key}</th>
                  <td className="whitespace-pre-wrap break-words p-3 align-top">{entry.config_value}</td>
                  <td className="whitespace-pre-wrap break-words p-3 align-top">{entry.description}</td>
                  <td className="p-3 align-top">
                    <div>{dateFormat.format(new Date(entry.updated_at))}</div>
                    <div className="mt-1 break-all text-xs text-slate-500">Admin ID {entry.updated_by}</div>
                  </td>
                  <td className="p-3 align-top">
                    <button type="button" disabled={save.isPending} className="font-semibold text-indigo-700 disabled:opacity-50"
                      onClick={() => {
                        const { config_key, config_value, description } = entry;
                        setFields({ config_key, config_value, description });
                        setEditing(true);
                        save.reset();
                        formRef.current?.scrollIntoView({ block: "start" });
                      }}>Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>
    </div>
  );
}
