"use client";
import { useState, useEffect } from "react";
import { BellIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const TYPE_STYLE: Record<string, string> = {
  INFO:    "bg-blue-50 text-blue-600 border-blue-100",
  SUCCESS: "bg-emerald-50 text-emerald-600 border-emerald-100",
  WARNING: "bg-amber-50 text-amber-600 border-amber-100",
  ERROR:   "bg-red-50 text-red-600 border-red-100",
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const fetchNotifications = () => {
    setLoading(true);
    userApi.get(`/api/user/notifications?page=${page}&limit=${limit}`)
      .then((res) => {
        setNotifications(res.data?.data?.notifications || []);
        setTotal(res.data?.data?.total || 0);
        setUnread(res.data?.data?.unreadCount || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, [page]);

  const markRead = async (id: number) => {
    await userApi.put(`/api/user/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await userApi.put("/api/user/notifications/read-all");
    fetchNotifications();
  };

  const deleteNotif = async (id: number) => {
    await userApi.delete(`/api/user/notifications/${id}`);
    fetchNotifications();
  };

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
      <div className="space-y-5 max-w-3xl" style={{ fontFamily: "var(--font-body)" }}>
        {/* Header */}
        <header className="flex items-center justify-between" style={{ animation: "fadeUp 0.35s ease both" }}>
          <div>
            <h1
              style={{
                fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.03em",
              }}
            >
              Notifications
            </h1>
            <p style={{ fontSize: 13.5, color: "#9CA3AF", marginTop: 4 }}>
              {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors cursor-pointer"
            >
              <CheckIcon className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </header>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full max-w-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <BellIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-5 py-4 flex items-start gap-4 transition-colors ${!n.isRead ? "bg-violet-50/30" : "hover:bg-gray-50/50"}`}
              >
                {/* Type dot */}
                <div className={`mt-0.5 h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${TYPE_STYLE[n.type] || TYPE_STYLE.INFO}`}>
                  <BellIcon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>
                      {n.title}
                    </p>
                    <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  {!n.isRead && (
                    <span className="inline-block h-2 w-2 bg-violet-500 rounded-full mt-1.5" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-violet-600 transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
