"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BellIcon, CheckIcon, TrashIcon, FunnelIcon,
  InformationCircleIcon, CheckCircleIcon,
  ExclamationTriangleIcon, ExclamationCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, ArchiveBoxXMarkIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import { timeAgo } from "@/components/ui/NotificationBell";

/* ── types ──────────────────────────────────────────────── */
interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link: string | null;
  createdAt: string;
}
type FilterType = "all" | "unread" | "info" | "success" | "warning" | "error";

/* ── constants ───────────────────────────────────────────── */
const TYPE_ICON: Record<string, React.ElementType> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
};

const TYPE_STYLES: Record<string, { icon: string; badge: string }> = {
  info:    { icon: "text-blue-500 bg-blue-50 border-blue-100",       badge: "text-blue-600 bg-blue-50 border-blue-100" },
  success: { icon: "text-emerald-500 bg-emerald-50 border-emerald-100", badge: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  warning: { icon: "text-amber-500 bg-amber-50 border-amber-100",    badge: "text-amber-600 bg-amber-50 border-amber-100" },
  error:   { icon: "text-red-500 bg-red-50 border-red-100",          badge: "text-red-600 bg-red-50 border-red-100" },
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "unread",  label: "Unread" },
  { key: "info",    label: "Info" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "error",   label: "Error" },
];

const BASE = "/api/charity/notifications";
const PAGE_SIZE = 15;

/* ── helpers ─────────────────────────────────────────────── */
function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function unwrap(data: unknown) {
  const d = data as Record<string, unknown>;
  const nested = d?.data as Record<string, unknown> | undefined;
  return {
    notifications: (nested?.notifications ?? d?.notifications ?? []) as Notification[],
    unreadCount:   ((nested?.unreadCount   ?? d?.unreadCount   ?? 0) as number),
    total:         ((nested?.total         ?? d?.total         ?? 0) as number),
  };
}

/* ── skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
      <div className="h-10 w-full bg-gray-50 rounded-lg animate-pulse" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-72 bg-gray-50 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────── */
export default function CharityNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit:  String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (filter === "unread") params.set("unreadOnly", "true");

      const res = await charityApi.get(`${BASE}?${params}`);
      let { notifications: items, unreadCount: count, total: t } = unwrap(res.data);

      if (["info", "success", "warning", "error"].includes(filter)) {
        items = items.filter((n) => n.type === filter);
      }

      setNotifications(items);
      setUnreadCount(count);
      setTotal(t);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [filter]);

  /* ── actions ──────────────────────────────────────────── */
  async function markRead(id: number) {
    try {
      await charityApi.put(`${BASE}/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await charityApi.put(`${BASE}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }

  async function remove(id: number) {
    const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
    try {
      await charityApi.delete(`${BASE}/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((t) => t - 1);
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }

  async function bulkMarkRead() {
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => charityApi.put(`${BASE}/${id}/read`)));
      const unreadMarked = notifications.filter((n) => ids.includes(n.id) && !n.isRead).length;
      setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - unreadMarked));
      setSelected(new Set());
    } catch { /* silent */ }
  }

  async function bulkDelete() {
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => charityApi.delete(`${BASE}/${id}`)));
      const unreadDeleted = notifications.filter((n) => ids.includes(n.id) && !n.isRead).length;
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setTotal((t) => t - ids.length);
      setUnreadCount((c) => Math.max(0, c - unreadDeleted));
      setSelected(new Set());
    } catch { /* silent */ }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(
      selected.size === notifications.length
        ? new Set()
        : new Set(notifications.map((n) => n.id)),
    );
  }

  /* ── derived ──────────────────────────────────────────── */
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const allSelected = notifications.length > 0 && selected.size === notifications.length;

  if (loading && notifications.length === 0) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === f.key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
              {f.key === "unread" && unreadCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  filter === "unread" ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkMarkRead}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
            >
              <CheckIcon className="h-3 w-3" /> Mark read
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            >
              <TrashIcon className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-3">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              {allSelected ? "Deselect all" : "Select all"}
            </span>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <ArchiveBoxXMarkIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">No notifications found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter !== "all" ? "Try changing the filter" : "Notifications will appear here when something happens"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => {
              const Icon = TYPE_ICON[notif.type] ?? InformationCircleIcon;
              const styles = TYPE_STYLES[notif.type] ?? TYPE_STYLES.info;

              return (
                <div
                  key={notif.id}
                  className={`px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors group ${
                    !notif.isRead ? "bg-emerald-50/20" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(notif.id)}
                    onChange={() => toggleSelect(notif.id)}
                    className="h-3.5 w-3.5 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="w-2 mt-2 shrink-0">
                    {!notif.isRead && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                  </div>
                  <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${styles.icon}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-tight ${!notif.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                            {notif.title}
                          </p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${styles.badge}`}>
                            {notif.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-gray-400" title={formatFullDate(notif.createdAt)}>
                            {timeAgo(notif.createdAt)}
                          </span>
                          {notif.link && (
                            <a href={notif.link} className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium">
                              View details →
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!notif.isRead && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(notif.id)}
                          className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Delete"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      page === p
                        ? "bg-emerald-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
