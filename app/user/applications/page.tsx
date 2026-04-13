"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import { APPLICATION_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";

interface Application {
  id: number;
  status: string;
  createdAt: string;
  message?: string;
  opportunity: {
    id: number;
    title: string;
    startDate?: string;
    location?: string;
    charity: { name: string; logoUrl?: string };
  };
}

const STATUS_CONFIG = APPLICATION_STATUS;
const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING:  ClockIcon,
  APPROVED: CheckCircleIcon,
  DECLINED: XCircleIcon,
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchApps = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    userApi.get(`/api/user/applications?${params}`)
      .then((res) => {
        setApplications(res.data?.data?.applications || []);
        setTotal(res.data?.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :root {
          --font-heading: 'Inter', sans-serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>
      <div className="space-y-5 max-w-4xl" style={{ fontFamily: "var(--font-body)" }}>
        {/* Header */}
        <header style={{ animation: "fadeUp 0.35s ease both" }}>
          <h1
            style={{
              fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.03em",
            }}
          >
            My Applications
          </h1>
          <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: "4px 0 0" }}>
            Track all your volunteering applications.
          </p>
        </header>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <div className="flex gap-1">
          {(["", "PENDING", "APPROVED", "DECLINED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === s ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["OPPORTUNITY", "CHARITY", "DATE", "STATUS", ""].map((h) => (
                <th key={h || "actions"} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28 mt-1.5" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-7 w-7" /></td>
                </tr>
              ))
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <ClipboardDocumentListIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No applications yet.</p>
                  <button onClick={() => router.push("/user/opportunities")} className="mt-2 text-xs text-violet-600 hover:text-violet-700 font-medium cursor-pointer">
                    Browse opportunities →
                  </button>
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
                const Icon = STATUS_ICONS[app.status] || ClockIcon;
                return (
                  <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p
                        className="text-sm font-medium text-gray-900 hover:text-violet-700 cursor-pointer transition-colors"
                        onClick={() => router.push(`/user/opportunities/${app.opportunity.id}`)}
                      >
                        {app.opportunity.title}
                      </p>
                      {app.opportunity.location && (
                        <p className="text-xs text-gray-400 mt-0.5">{app.opportunity.location}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{app.opportunity.charity.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(app.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => router.push(`/user/opportunities/${app.opportunity.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-violet-600 transition-colors cursor-pointer"
                        title="View"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Previous</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Next</button>
        </div>
      )}
    </div>
    </>
  );
}
