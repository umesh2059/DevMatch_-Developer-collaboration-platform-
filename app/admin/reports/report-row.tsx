"use client";

import { useTransition } from "react";
import { dismissReportAction, removeReportedContentAction } from "@/app/actions/admin";
import type { ReportStatus, ReportTargetType } from "@prisma/client";

export type AdminReportData = {
  id: string;
  status: ReportStatus;
  reason: string;
  createdAt: Date;
  targetType: ReportTargetType;
  reporter: { id: string; name: string };
  target: { label: string; missing: boolean };
};

const STATUS_STYLES: Record<ReportStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  RESOLVED: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  DISMISSED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export function AdminReportRow({ report }: { report: AdminReportData }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="badge">{report.targetType}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[report.status]}`}>
          {report.status}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">{report.target.label}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{report.reason}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Reported by {report.reporter.name} on {report.createdAt.toLocaleDateString()}
      </p>

      {report.status === "OPEN" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={isPending || report.target.missing}
            onClick={() => startTransition(() => removeReportedContentAction(report.id))}
            className="btn-secondary !px-2.5 !py-1 text-xs text-red-600"
          >
            {report.targetType === "PROJECT" ? "Archive project" : "Delete message"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => dismissReportAction(report.id))}
            className="btn-secondary !px-2.5 !py-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
