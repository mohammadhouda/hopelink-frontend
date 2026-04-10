"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AxiosInstance } from "axios";
import {
  BellIcon, CheckIcon, TrashIcon,
  InformationCircleIcon, CheckCircleIcon,
  ExclamationTriangleIcon, ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

/* ── types ──────────────────────────────────────────────── */
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

/* ── constants ───────────────────────────────────────────── */
const TYPE_ICON: Record<string, React.ElementType> = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
};

const TYPE_COLOR: Record<string, string> = {
  info: "text-blue-500 bg-blue-50",
  success: "text-emerald-500 bg-emerald-50",
  warning: "text-amber-500 bg-amber-50",
  error: "text-red-500 bg-red-50",
};

type Theme = "blue" | "emerald";

const THEME: Record<Theme, { spinner: string; unreadBg: string; unreadDot: string; accent: string }> = {
  blue:    { spinner: "border-t-blue-600",    unreadBg: "bg-blue-50/30",    unreadDot: "bg-blue-500",    accent: "text-blue-600 hover:text-blue-700" },
  emerald: { spinner: "border-t-emerald-500", unreadBg: "bg-emerald-50/20", unreadDot: "bg-emerald-500", accent: "text-emerald-600 hover:text-emerald-700" },
};

/* ── helpers ─────────────────────────────────────────────── */
export function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Handles both { notifications, unreadCount } and { data: { notifications, unreadCount } } */
function unwrap(data: unknown): { notifications: Notification[]; unreadCount: number } {
  const d = data as Record<string, unknown>;
  const nested = d?.data as Record<string, unknown> | undefined;
  return {
    notifications: (nested?.notifications ?? d?.notifications ?? []) as Notification[],
    unreadCount: ((nested?.unreadCount ?? d?.unreadCount ?? 0) as number),
  };
}

function unwrapCount(data: unknown): number {
  const d = data as Record<string, unknown>;
  const nested = d?.data as Record<string, unknown> | undefined;
  return ((nested?.unreadCount ?? d?.unreadCount ?? 0) as number);
}

/* ── component ───────────────────────────────────────────── */
interface NotificationBellProps {
  apiClient: AxiosInstance;
  /** Base path without trailing slash, e.g. "/api/charity/notifications" */
  basePath: string;
  /** Route to navigate to the full notifications page */
  viewAllPath: string;
  theme?: Theme;
  /** Called when the panel opens, e.g. to close other dropdowns */
  onOpen?: () => void;
}

export default function NotificationBell({
  apiClient,
  basePath,
  viewAllPath,
  theme = "blue",
  onOpen,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = THEME[theme] ?? THEME.blue;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get(`${basePath}/unread-count`);
      setUnreadCount(unwrapCount(res.data));
    } catch { /* silent */ }
  }, [apiClient, basePath]);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  async function openPanel() {
    if (open) { setOpen(false); return; }
    onOpen?.();
    setOpen(true);
    setLoading(true);
    try {
      const res = await apiClient.get(`${basePath}?limit=10`);
      const { notifications: list, unreadCount: count } = unwrap(res.data);
      setNotifications(list);
      setUnreadCount(count);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  async function markRead(id: number) {
    try {
      await apiClient.put(`${basePath}/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await apiClient.put(`${basePath}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }

  async function remove(id: number) {
    const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
    try {
      await apiClient.delete(`${basePath}/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }

  function handleClick(notif: Notification) {
    if (!notif.isRead) markRead(notif.id);
    if (notif.link) { setOpen(false); router.push(notif.link); }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={openPanel}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className={`text-xs font-medium cursor-pointer ${t.accent}`}>
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className={`h-5 w-5 rounded-full border-2 border-gray-200 ${t.spinner} animate-spin`} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : notifications.map((notif) => {
              const Icon = TYPE_ICON[notif.type] ?? InformationCircleIcon;
              const color = TYPE_COLOR[notif.type] ?? TYPE_COLOR.info;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`px-4 py-3 flex gap-3 hover:bg-gray-50/80 transition-colors group ${notif.link ? "cursor-pointer" : ""} ${!notif.isRead ? t.unreadBg : ""}`}
                >
                  {/* Unread dot */}
                  <div className="w-2 pt-1.5 shrink-0">
                    {!notif.isRead && <div className={`h-1.5 w-1.5 rounded-full ${t.unreadDot}`} />}
                  </div>
                  {/* Icon */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight truncate ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Delete"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <button
                onClick={() => { setOpen(false); router.push(viewAllPath); }}
                className={`text-xs font-medium cursor-pointer ${t.accent}`}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
