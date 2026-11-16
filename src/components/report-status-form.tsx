"use client";

import { useActionState } from "react";
import { updateReportStatus } from "@/app/reports/actions";
import type { ActionState, Report } from "@/lib/reports";

export function ReportStatusForm({ report }: { report: Report }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateReportStatus, {});
  return <form action={action} className="border-t border-surface-container px-5 py-4">
    <input type="hidden" name="id" value={report.id} />
    <p className="mb-3 text-label-md font-semibold">Status: {report.status === "ACTIVE" ? "Aktif" : report.status === "RESOLVED" ? "Selesai" : "Diarsipkan"}</p>
    <div className="flex flex-wrap gap-2"><button type="submit" name="status" value="RESOLVED" disabled={pending || report.status !== "ACTIVE"} className="min-h-10 rounded-xl bg-tertiary-fixed px-3 text-label-md font-semibold text-tertiary disabled:cursor-not-allowed disabled:opacity-40">{pending ? "Memproses..." : "Tandai Selesai"}</button><button type="submit" name="status" value="ARCHIVED" disabled={pending || report.status === "ARCHIVED"} className="min-h-10 rounded-xl bg-surface-container px-3 text-label-md font-semibold text-on-surface-variant disabled:cursor-not-allowed disabled:opacity-40">Arsipkan</button></div>
    {state.error && <p role="alert" className="mt-3 text-body-sm text-error">{state.error}</p>}{state.message && <p role="status" className="mt-3 text-body-sm text-tertiary">{state.message}</p>}
  </form>;
}
