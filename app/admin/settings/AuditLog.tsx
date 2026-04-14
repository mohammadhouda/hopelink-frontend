"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FunnelIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";
import CustomDropdown from "@/components/CustomDropdown";

interface AuditEntry {
  id: number;
  user: string;
  userEmail: string;
  action: string;
  target: string;
  targetType: string;
  details: string;
  ipAddress: string | null;
  timestamp: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: PlusCircleIcon,
  updated: PencilSquareIcon,
  deleted: TrashIcon,
  approved: CheckCircleIcon,
  declined: XCircleIcon,
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-blue-600 bg-blue-50 border-blue-100",
  updated: "text-amber-600 bg-amber-50 border-amber-100",
  deleted: "text-red-600 bg-red-50 border-red-100",
  approved: "text-emerald-600 bg-emerald-50 border-emerald-100",
  declined: "text-red-600 bg-red-50 border-red-100",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "30");
      if (filterAction !== "all") params.set("action", filterAction);

      const res = await api.get(`/api/admin/settings/audit-log?${params}`);
      setEntries(res.data?.data?.entries);
      setTotalPages(res.data?.data?.totalPages);
      setTotal(res.data?.data?.total);
    } catch {
      console.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const uniqueActions = Array.from(new Set(entries.map((e) => e.action)));

  function resetFilters() {
    setFilterAction("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">Track every admin action on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FunnelIcon className="h-3.5 w-3.5" />
          Filter:
        </div>
        
        <CustomDropdown
          options={[
            { label: "All Actions", value: "all" },
            ...uniqueActions.map((action) => ({ label: action.charAt(0).toUpperCase() + action.slice(1), value: action })),
          ]}
          value={filterAction}
          onChange={(val) => { setFilterAction(val); setPage(1); }}
        />


        {filterAction !== "all" && (
          <button onClick={resetFilters} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer flex items-center gap-1">
            <ArrowPathIcon className="h-3 w-3" /> Reset
          </button>
        )}
        <span className="text-[11px] text-gray-400 ml-auto">{total} entries</span>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-40 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">No audit entries found.</div>
      ) : (
        <div className="space-y-0">
          {entries.map((entry, index) => {
            const ActionIcon = ACTION_ICONS[entry.action] || PencilSquareIcon;
            const actionColor = ACTION_COLORS[entry.action] || ACTION_COLORS.updated;

            return (
              <div key={entry.id} className="flex gap-3 group">
                <div className="flex flex-col items-center">
                  <div className={`h-7 w-7 rounded-full border flex items-center justify-center flex-shrink-0 ${actionColor}`}>
                    <ActionIcon className="h-3.5 w-3.5" />
                  </div>
                  {index < entries.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 my-1" />
                  )}
                </div>

                <div className="pb-5 flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{entry.user}</span>
                        {" "}
                        <span className="text-gray-500">{entry.action}</span>
                        {" "}
                        <span className="font-medium">{entry.target}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{entry.details}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-[11px] text-gray-400">{timeAgo(entry.timestamp)}</p>
                      {entry.ipAddress && (
                        <p className="text-[10px] text-gray-300 font-mono mt-0.5">{entry.ipAddress}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer disabled:cursor-default">
            <ChevronLeftIcon className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer disabled:cursor-default">
            <ChevronRightIcon className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}