"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useWithdrawal, useWithdrawalAction } from "./queries";
import { coins, dateTime, money, statusLabels } from "./types";
import {
  RevenueDialog,
  RevenueEmpty,
  RevenueIcon,
  RevenueLoading,
  RevenuePagination,
  WithdrawalBadge,
  revenueButton,
  revenueField,
  revenuePrimary,
} from "./RevenueUi";

export function WithdrawalDetail({
  id,
  admin = false,
  initialSection = "information",
  onClose,
}: {
  id: string;
  admin?: boolean;
  initialSection?: "information" | "processing";
  onClose: () => void;
}) {
  const {
    data: request,
    isPending,
    isError,
    refetch,
  } = useWithdrawal(id, admin);
  const action = useWithdrawalAction();
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [section, setSection] = useState<
    "information" | "history" | "processing"
  >(initialSection);
  const [historyPage, setHistoryPage] = useState(1);
  const run = async (name: string) => {
    try {
      await action.mutateAsync({
        path: `${admin ? "/admin/withdrawals" : "/authors/me/withdrawals"}/${id}/${name}`,
        body:
          name === "complete"
            ? { transactionCode: code.trim(), note: note.trim() }
            : name === "notes" || name === "reject"
              ? { note: note.trim() }
              : undefined,
      });
      setConfirmPaid(false);
      setConfirmReject(false);
      setConfirmCancel(false);
      setNote("");
      setCode("");
    } catch {
      /* displayed by mutation */
    }
  };
  const handler = request?.history.find(
    (event) => event.status === "PROCESSING",
  );
  const handlerId =
    handler &&
    (typeof handler.actorId === "string"
      ? handler.actorId
      : handler.actorId?._id);
  const authorId =
    request &&
    (typeof request.authorId === "string"
      ? request.authorId
      : request.authorId?._id);
  const mayHandle =
    admin &&
    authorId !== user?._id &&
    (!handlerId || handlerId === user?._id || user?.role === "ADMIN");
  const historySize = 6;
  const events =
    request?.history.slice(
      (historyPage - 1) * historySize,
      historyPage * historySize,
    ) || [];

  return (
    <RevenueDialog
      title={admin ? "Xử lý rút nhuận bút" : "Chi tiết yêu cầu rút tiền"}
      subtitle={`Mã yêu cầu: ${id}`}
      busy={action.isPending}
      onClose={onClose}
      footer={
        <>
          {!admin && request?.status === "PENDING" && (
            <button
              className={`${revenueButton} mr-auto border-rose-200 text-rose-600 hover:bg-rose-50`}
              disabled={action.isPending}
              onClick={() => setConfirmCancel((value) => !value)}
            >
              {confirmCancel ? "Giữ yêu cầu" : "Hủy yêu cầu"}
            </button>
          )}
          <button
            className={revenueButton}
            onClick={onClose}
            disabled={action.isPending}
          >
            Đóng
          </button>
          {confirmCancel && !admin && request?.status === "PENDING" && (
            <button
              className="min-h-10 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-40"
              disabled={action.isPending}
              onClick={() => run("cancel")}
            >
              {action.isPending ? "Đang hủy…" : "Xác nhận hủy"}
            </button>
          )}
        </>
      }
    >
      {isPending && <RevenueLoading rows={4} />}
      {isError && (
        <RevenueEmpty
          error
          title="Không tải được yêu cầu"
          description="Vui lòng thử tải lại thông tin yêu cầu rút tiền."
          action={
            <button className={revenueButton} onClick={() => refetch()}>
              Thử lại
            </button>
          }
        />
      )}
      {request && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-linear-to-br from-slate-50 to-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">
                Số tiền thực nhận
              </span>
              <WithdrawalBadge status={request.status} />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {money(request.amount)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {coins(request.coinAmount)} × {money(request.exchangeRate)}/Xu ×{" "}
              {request.payoutPercent}%
            </p>
          </div>
          <div
            className="flex gap-1 rounded-xl bg-slate-100/80 p-1"
            role="group"
            aria-label="Nội dung chi tiết yêu cầu"
          >
            <button
              aria-pressed={section === "information"}
              onClick={() => setSection("information")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${section === "information" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Thông tin yêu cầu
            </button>
            {admin && (
              <button
                aria-pressed={section === "processing"}
                onClick={() => setSection("processing")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${section === "processing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Xử lý yêu cầu
              </button>
            )}
            <button
              aria-pressed={section === "history"}
              onClick={() => setSection("history")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${section === "history" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Lịch sử xử lý{" "}
              <span className="ml-1 text-[10px] text-slate-400">
                ({request.history.length})
              </span>
            </button>
          </div>
          {section === "information" ? (
            <div className="space-y-5">
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
                <div>
                  <dt className="text-slate-400">Ngày gửi</dt>
                  <dd className="mt-1.5 font-medium text-slate-700">
                    {dateTime(request.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Cập nhật gần nhất</dt>
                  <dd className="mt-1.5 font-medium text-slate-700">
                    {dateTime(request.updatedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Xu quyết toán</dt>
                  <dd className="mt-1.5 font-semibold text-slate-800 tabular-nums">
                    {coins(request.coinAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Tỷ lệ thực nhận</dt>
                  <dd className="mt-1.5 font-semibold text-slate-800">
                    {request.payoutPercent}%
                  </dd>
                </div>
                {admin && typeof request.authorId !== "string" && (
                  <div className="col-span-2">
                    <dt className="text-slate-400">Tác giả</dt>
                    <dd className="mt-1.5 font-medium text-slate-700">
                      {request.authorId?.displayName ||
                        "Không còn tài khoản"}
                    </dd>
                  </div>
                )}
              </dl>
              <section className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-slate-600">
                  <RevenueIcon name="bank" />
                  Tài khoản nhận tiền
                </div>
                <dl className="space-y-3 p-4 text-xs">
                  {[
                    ["Ngân hàng", request.bankName],
                    ["Số tài khoản", request.bankAccountNumber],
                    ["Chủ tài khoản", request.bankAccountName],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="shrink-0 text-slate-400">{label}</dt>
                      <dd className="break-all text-right font-semibold text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
              {request.transactionCode && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <RevenueIcon name="check" />
                    Đã xác nhận chuyển khoản
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-slate-700">
                    {request.transactionCode}
                  </p>
                </div>
              )}
              {request.note && (
                <div
                  className={`rounded-xl border p-4 ${request.status === "REJECTED" ? "border-rose-100 bg-rose-50/60" : "border-amber-100 bg-amber-50/60"}`}
                >
                  <p className="text-xs font-semibold text-slate-700">
                    Ghi chú xử lý
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                    {request.note}
                  </p>
                </div>
              )}
              {!admin && request.status === "REJECTED" && (
                <p className="text-xs leading-5 text-slate-500">
                  Nếu sai tài khoản, hãy sửa thông tin ngân hàng trong hồ sơ rồi
                  gửi yêu cầu mới.
                </p>
              )}
            </div>
          ) : section === "history" ? (
            <section className="overflow-hidden rounded-xl border border-slate-200">
              <ol className="space-y-0 px-5 pt-5">
                {events.map((event, index) => (
                  <li
                    key={(historyPage - 1) * historySize + index}
                    className="relative border-l border-slate-200 pb-6 pl-5 last:border-transparent"
                  >
                    <span
                      className={`absolute -left-1 top-1 h-2 w-2 rounded-full ring-4 ring-white ${event.status === "COMPLETED" ? "bg-emerald-500" : event.status === "REJECTED" ? "bg-rose-400" : "bg-sky-400"}`}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <p className="text-xs font-semibold text-slate-800">
                        {statusLabels[event.status]}
                      </p>
                      <time className="text-[10px] text-slate-400">
                        {dateTime(event.at)}
                      </time>
                    </div>
                    <p className="mt-1.5 break-all text-[11px] text-slate-500">
                      {typeof event.actorId === "string"
                        ? event.actorId
                        : event.actorId?.displayName ||
                          "Tài khoản đã xóa"}
                    </p>
                    {event.note && (
                      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                        {event.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
              <RevenuePagination
                page={historyPage}
                totalPages={Math.max(
                  1,
                  Math.ceil(request.history.length / historySize),
                )}
                totalItems={request.history.length}
                pageSize={historySize}
                onPage={setHistoryPage}
              />
            </section>
          ) : null}
          {admin && section === "processing" && (
            <div className="space-y-4">
              <div
                className="grid grid-cols-3 gap-1.5"
                aria-label="Tiến trình xử lý"
              >
                {["PENDING", "PROCESSING", "COMPLETED"].map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-lg border px-2 py-2.5 text-center text-[10px] font-semibold ${request.status === step ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-slate-50 text-slate-400"}`}
                  >
                    <span className="mr-1">{index + 1}.</span>
                    {step === "PENDING"
                      ? "Tiếp nhận"
                      : step === "PROCESSING"
                        ? "Chuyển khoản"
                        : "Hoàn thành"}
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <RevenueIcon name="bank" />
                  Tài khoản nhận đã chốt
                </p>
                <dl className="space-y-2.5 text-xs">
                  {[
                    ["Ngân hàng", request.bankName],
                    ["Số tài khoản", request.bankAccountNumber],
                    ["Chủ tài khoản", request.bankAccountName],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="shrink-0 text-slate-400">{label}</dt>
                      <dd className="break-all text-right font-semibold text-slate-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              {request.note && (
                <p className="whitespace-pre-wrap rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  <strong>Ghi chú trước đó:</strong> {request.note}
                </p>
              )}
              {request.status === "PENDING" ? (
                <p className="text-xs leading-5 text-slate-500">
                  Kiểm tra thông tin người nhận trước khi duyệt và nhận xử lý.
                  Việc duyệt chưa đồng nghĩa đã chuyển tiền.
                </p>
              ) : request.status === "PROCESSING" ? (
                <p className="text-xs leading-5 text-slate-500">
                  Chuyển khoản thủ công theo tài khoản trên, sau đó nhập mã giao
                  dịch để xác nhận. Nếu gặp lỗi, lưu ghi chú trước khi tiếp tục.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5">
                  <p className="font-semibold text-slate-700">
                    Yêu cầu {statusLabels[request.status].toLowerCase()}.
                  </p>
                  {request.transactionCode && (
                    <p className="mt-1 break-all font-mono text-slate-500">
                      Mã chuyển khoản: {request.transactionCode}
                    </p>
                  )}
                  <button
                    className="mt-2 font-semibold text-indigo-600 hover:underline"
                    onClick={() => setSection("information")}
                  >
                    Xem thông tin kết quả
                  </button>
                </div>
              )}
            </div>
          )}
          {confirmCancel && !admin && request.status === "PENDING" && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-700"
            >
              <strong>Hủy yêu cầu rút tiền?</strong>
              <p className="mt-1">
                Toàn bộ {coins(request.coinAmount)} sẽ trở lại số dư khả dụng.
                Bấm “Xác nhận hủy” bên dưới để tiếp tục.
              </p>
            </div>
          )}
          {admin &&
            section === "processing" &&
            !mayHandle &&
            ["PENDING", "PROCESSING"].includes(request.status) && (
              <p className="rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                Yêu cầu do quản lý khác phụ trách hoặc thuộc tài khoản của bạn.
              </p>
            )}
          {section === "processing" &&
            mayHandle &&
            ["PENDING", "PROCESSING"].includes(request.status) && (
              <section className="space-y-4 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Xử lý yêu cầu
                </h3>
                <label className="block space-y-2 text-xs font-medium text-slate-500">
                  Ghi chú / lý do từ chối
                  <textarea
                    maxLength={1000}
                    className={`${revenueField} min-h-24 resize-y`}
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value);
                      setConfirmReject(false);
                    }}
                    placeholder="Ví dụ: ngân hàng từ chối do sai số tài khoản; vui lòng sửa hồ sơ và gửi lại."
                  />
                </label>
                {request.status === "PROCESSING" && (
                  <label className="block space-y-2 text-xs font-medium text-slate-500">
                    Mã giao dịch chuyển khoản
                    <input
                      maxLength={120}
                      className={revenueField}
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value);
                        setConfirmPaid(false);
                      }}
                    />
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  {request.status === "PENDING" && (
                    <button
                      className={revenuePrimary}
                      disabled={action.isPending}
                      onClick={() => run("process")}
                    >
                      Duyệt và nhận xử lý
                    </button>
                  )}
                  {request.status === "PROCESSING" && (
                    <button
                      className={revenueButton}
                      disabled={action.isPending || !note.trim()}
                      onClick={() => run("notes")}
                    >
                      Lưu ghi chú
                    </button>
                  )}
                  <button
                    className={`${revenueButton} text-rose-600`}
                    disabled={action.isPending || !note.trim()}
                    onClick={() => setConfirmReject(true)}
                  >
                    Từ chối yêu cầu
                  </button>
                  {request.status === "PROCESSING" && (
                    <button
                      className={revenuePrimary}
                      disabled={action.isPending || code.trim().length < 3}
                      onClick={() => setConfirmPaid(true)}
                    >
                      Xác nhận đã chuyển tiền
                    </button>
                  )}
                </div>
                {confirmReject && (
                  <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5">
                    <p>
                      Chỉ từ chối nếu chắc chắn chưa chuyển tiền thành công.{" "}
                      {coins(request.coinAmount)} sẽ được giải phóng.
                    </p>
                    <button
                      className={revenueButton}
                      disabled={action.isPending}
                      onClick={() => run("reject")}
                    >
                      Xác nhận từ chối
                    </button>
                  </div>
                )}
                {confirmPaid && (
                  <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5">
                    <p>
                      Xác nhận đã chuyển thành công {money(request.amount)} tới{" "}
                      {request.bankAccountNumber}? Hành động này hoàn tất yêu
                      cầu.
                    </p>
                    <button
                      className={revenueButton}
                      disabled={action.isPending}
                      onClick={() => run("complete")}
                    >
                      Đã kiểm tra giao dịch, hoàn thành
                    </button>
                  </div>
                )}
                <p className="text-[11px] leading-5 text-slate-400">
                  Nếu chưa rõ kết quả chuyển khoản, giữ trạng thái đang xử lý và
                  ghi chú để đối soát trước khi chuyển lại.
                </p>
              </section>
            )}
        </div>
      )}
    </RevenueDialog>
  );
}
