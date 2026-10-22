import React from "react";
import type {
  AuthorRequestStatusData,
  AuthorRequestStatus,
} from "@/features/author";
import { Button } from "@/components/ui";

interface RequestStatusCardProps {
  data: AuthorRequestStatusData;
  onEdit: () => void;
}

export function RequestStatusCard({ data, onEdit }: RequestStatusCardProps) {
  const { request, authorProfile, isAuthor, canEdit } = data;

  if (isAuthor && authorProfile) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-emerald-800 text-lg">Bạn đã là Tác giả!</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Bút danh: <strong>{authorProfile.penName}</strong>
            </p>
            {authorProfile.biography && (
              <p className="text-sm text-emerald-600 mt-1">{authorProfile.biography}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-700">
              <span>📖 {authorProfile.storyCount || 0} tác phẩm</span>
              <span>👥 {authorProfile.followerCount || 0} người theo dõi</span>
              <span>👁️ {authorProfile.totalViews || 0} lượt xem</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const statusConfig: Record<
    AuthorRequestStatus,
    {
      bg: string;
      border: string;
      iconBg: string;
      title: string;
      titleColor: string;
      desc: string;
      descColor: string;
    }
  > = {
    PENDING: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      iconBg: "bg-yellow-400",
      title: "Đang chờ xét duyệt",
      titleColor: "text-yellow-800",
      desc: "Yêu cầu của bạn đang được xem xét. Chúng tôi sẽ phản hồi sớm nhất có thể.",
      descColor: "text-yellow-700",
    },
    APPROVED: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconBg: "bg-emerald-500",
      title: "Yêu cầu đã được duyệt",
      titleColor: "text-emerald-800",
      desc: "Chúc mừng! Tài khoản của bạn đã được nâng cấp thành Tác giả.",
      descColor: "text-emerald-700",
    },
    REJECTED: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-500",
      title: "Yêu cầu bị từ chối",
      titleColor: "text-red-800",
      desc: "Yêu cầu của bạn chưa được chấp nhận lần này. Bạn có thể chỉnh sửa và gửi lại.",
      descColor: "text-red-700",
    },
  };

  const cfg = statusConfig[request.status];

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-6 space-y-3`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${cfg.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {request.status === "PENDING" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : request.status === "APPROVED" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${cfg.titleColor}`}>{cfg.title}</h3>
          <p className={`text-sm mt-0.5 ${cfg.descColor}`}>{cfg.desc}</p>
          {request.adminNote && (
            <div className="mt-2 p-2.5 bg-white/60 rounded-xl border border-current/10">
              <p className="text-xs font-medium text-zinc-600">Ghi chú từ quản trị viên:</p>
              <p className={`text-sm mt-0.5 ${cfg.descColor}`}>{request.adminNote}</p>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-600">
            <span>
              Bút danh: <strong>{request.penName}</strong>
            </span>
            {request.createdAt && (
              <span>Ngày gửi: {new Date(request.createdAt).toLocaleDateString("vi-VN")}</span>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="pt-2 border-t border-current/10">
          <Button id="btn-edit-request" variant="outline" size="sm" onClick={onEdit}>
            ✏️ Chỉnh sửa yêu cầu
          </Button>
        </div>
      )}
    </div>
  );
}
