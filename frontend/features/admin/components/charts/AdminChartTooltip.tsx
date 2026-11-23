import type { ReactNode } from "react";

/** Keep the tooltip inside the plot width, including the first and last points. */
export function AdminChartTooltip({ anchorPercent, children }: { anchorPercent: number; children: ReactNode }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute top-2 z-30 rounded-xl border border-gray-700/80 bg-gray-900/95 px-3 py-2 text-xs text-white shadow-xl break-words"
      style={{
        width: "min(16rem, calc(100% - 16px))",
        left: `clamp(8px, calc(${anchorPercent}% - 8rem), max(8px, calc(100% - 16rem - 8px)))`,
      }}
    >
      {children}
    </div>
  );
}
