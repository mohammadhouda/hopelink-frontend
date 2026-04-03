"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  lastActive: string;
  deviceInfo: string | null;
}

interface LoginEntry {
  id: number;
  ip: string;
  status: "success" | "failed";
  reason: string | null;
  timestamp: string;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Active now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SecuritySettings() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/settings/sessions");
      setSessions(res.data);
    } catch {
      console.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const fetchLoginHistory = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/settings/login-history");
      setLoginHistory(res.data.entries);
    } catch {
      console.error("Failed to load login history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchLoginHistory();
  }, [fetchSessions, fetchLoginHistory]);

  async function revokeSession(id: string) {
    try {
      await api.delete(`/api/admin/settings/sessions/${id}`);
      setSessions((s) => s.filter((sess) => sess.id !== id));
    } catch {
      console.error("Failed to revoke session");
    }
  }

  async function revokeAll() {
    try {
      await api.delete("/api/admin/settings/sessions");
      await fetchSessions();
    } catch {
      console.error("Failed to revoke sessions");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Security</h2>
        <p className="text-sm text-gray-500 mt-1">Manage authentication, sessions, and monitor login activity.</p>
      </div>

      {/* 2FA */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <ShieldCheckIcon className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h3>
              <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security with TOTP.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
              twoFaEnabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
            }`}>
              {twoFaEnabled ? "Enabled" : "Disabled"}
            </span>
            <button onClick={() => setTwoFaEnabled(!twoFaEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                twoFaEnabled ? "bg-emerald-500" : "bg-gray-200"
              }`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                twoFaEnabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Active Sessions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Devices currently signed in to your account.</p>
          </div>
          {sessions.length > 1 && (
            <button onClick={revokeAll} className="text-[11px] font-medium text-red-500 hover:text-red-600 cursor-pointer">
              Revoke all other sessions
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">No active sessions found.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s, index) => (
              <div key={s.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {s.device === "Desktop" ? (
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <DevicePhoneMobileIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{s.browser} · {s.device}</p>
                      {index === 0 && (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {s.ip} · {timeAgo(s.lastActive)}
                    </p>
                  </div>
                </div>
                {index !== 0 && (
                  <button onClick={() => revokeSession(s.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer">
                    <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Login History</h3>
        {loadingHistory ? (
          <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">No login history found.</div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Time</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">IP Address</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600">{formatTimestamp(entry.timestamp)}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">{entry.ip}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        entry.status === "success"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {entry.status === "success" ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}