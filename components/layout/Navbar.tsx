'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import Logo from "@/components/logo";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  CheckIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICON = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
};

const TYPE_COLOR = {
  info: "text-blue-500 bg-blue-50",
  success: "text-emerald-500 bg-emerald-50",
  warning: "text-amber-500 bg-amber-50",
  error: "text-red-500 bg-red-50",
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Navbar() {
  const { user, loading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch unread count on mount + poll every 30s
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/notifications/unread-count");
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [loading, user, fetchUnreadCount]);

  // Fetch notifications when panel opens
  async function openNotifications() {
    setNotifOpen(true);
    setDropdownOpen(false);
    setNotifLoading(true);
    try {
      const res = await api.get("/api/admin/notifications?limit=10");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleMarkAsRead(id: number) {
    try {
      await api.put(`/api/admin/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.put("/api/admin/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  async function handleDelete(id: number) {
    const wasUnread = notifications.find((n) => n.id === id && !n.isRead);
    try {
      await api.delete(`/api/admin/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }

  function handleNotifClick(notif: Notification) {
    if (!notif.isRead) handleMarkAsRead(notif.id);
    if (notif.link) {
      setNotifOpen(false);
      router.push(notif.link);
    }
  }

  const handleLogout = () => {
    router.replace("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center">
        <Logo className="w-50 h-12.5" />
      </div>

      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        ) : (
          <>
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => (notifOpen ? setNotifOpen(false) : openNotifications())}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-8 flex justify-center">
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <BellIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = TYPE_ICON[notif.type] || InformationCircleIcon;
                        const color = TYPE_COLOR[notif.type] || TYPE_COLOR.info;
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                              notif.link ? "cursor-pointer" : ""
                            } ${!notif.isRead ? "bg-blue-50/30" : ""}`}
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-tight ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                  {notif.title}
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                  {!notif.isRead && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                                      className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer"
                                      title="Mark as read"
                                    >
                                      <CheckIcon className="h-3 w-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
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
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                      <button
                        onClick={() => { setNotifOpen(false); router.push("/admin/notifications"); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-200 mx-1" />

            {/* User Dropdown — same as before */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => { setDropdownOpen((prev) => !prev); setNotifOpen(false); }}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-sm font-medium text-gray-600">
                  {user?.avatarUrl ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${user.avatarUrl}`}
                      alt={user?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight">{user?.name || "Admin"}</span>
                  <span className="text-xs text-gray-500 leading-tight">{user?.email || ""}</span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5">
                  <div className="px-4 py-2.5 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{user?.name || "Admin"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { setDropdownOpen(false); router.push("/admin/profile"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <UserCircleIcon className="h-4 w-4 text-gray-400" /> Profile
                  </button>
                  <button onClick={() => { setDropdownOpen(false); router.push("/admin/settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Cog6ToothIcon className="h-4 w-4 text-gray-400" /> Settings
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}