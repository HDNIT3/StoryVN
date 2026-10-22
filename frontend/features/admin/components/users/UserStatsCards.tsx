import React from "react";

interface UserStatsCardsProps {
  statsLoading: boolean;
  totalUsers: number;
  totalActive: number;
  totalAuthors: number;
  totalBanned: number;
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 bg-white shadow-xs ${color}`}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/70 shadow-xs">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight">{value.toLocaleString("vi-VN")}</p>
        <p className="text-xs font-semibold opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  statsLoading,
  totalUsers,
  totalActive,
  totalAuthors,
  totalBanned,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Tổng người dùng"
        value={statsLoading ? 0 : totalUsers}
        color="border-sky-100 text-sky-800"
        icon={
          <svg className="w-6 h-6 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />
      <StatCard
        label="Đang hoạt động"
        value={statsLoading ? 0 : totalActive}
        color="border-emerald-100 text-emerald-800"
        icon={
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="Tác giả"
        value={statsLoading ? 0 : totalAuthors}
        color="border-violet-100 text-violet-800"
        icon={
          <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        }
      />
      <StatCard
        label="Bị cấm"
        value={statsLoading ? 0 : totalBanned}
        color="border-red-100 text-red-800"
        icon={
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        }
      />
    </div>
  );
};
