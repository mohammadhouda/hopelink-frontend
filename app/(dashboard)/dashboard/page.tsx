"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell,
} from "recharts";
import {
  ClockIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";

/* ── types ───────────────────────────────────────────────── */
interface PendingRequestsMetric {
  total: number;
  registration: number;
  verification: number;
}

interface ActiveUsersMetric {
  total: number;
  growth: number;
}

interface ActiveProjectsMetric {
  active: number;
  total: number;
}

interface RegistrationTrend {
  month: string;
  year: number;
  count: number;
}

interface CityStat {
  city: string;
  count: number;
}

interface PendingAction {
  id: number;
  org: string;
  email: string;
  type: "Registration" | "Verification";
  category: string | null;
  city: string | null;
  submitted: string;
}

interface RecentDecision {
  id: number;
  org: string;
  email: string;
  type: "Registration" | "Verification";
  status: "APPROVED" | "DECLINED";
  reviewedAt: string;
  reviewNote: string | null;
}

interface DashboardData {
  metrics: {
    pendingRequests: PendingRequestsMetric;
    activeUsers: ActiveUsersMetric;
    activeProjects: ActiveProjectsMetric;
  };
  registrationTrends: RegistrationTrend[];
  ngosByCity: CityStat[];
  pendingActions: PendingAction[];
  recentDecisions: RecentDecision[];
}

/* ── styles ──────────────────────────────────────────────── */
const categoryStyles: Record<string, string> = {
  EDUCATION: "bg-blue-50 text-blue-700 border-blue-200",
  HEALTH: "bg-pink-50 text-pink-700 border-pink-200",
  ENVIRONMENT: "bg-green-50 text-green-700 border-green-200",
  ANIMAL_WELFARE: "bg-orange-50 text-orange-700 border-orange-200",
  SOCIAL: "bg-yellow-50 text-yellow-700 border-yellow-200",
  OTHER: "bg-gray-50 text-gray-600 border-gray-200",
};

const typeStyles: Record<string, string> = {
  Registration: "bg-amber-50 text-amber-700 border-amber-200",
  Verification: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

/* ── chart tooltip ───────────────────────────────────────── */
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: Record<string, unknown> }>;
  labelKey: string;
  valueLabel: string;
}

const ChartTooltip = ({ active, payload, labelKey, valueLabel }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="text-gray-500">{String(payload[0].payload[labelKey])}</p>
      <p className="font-semibold text-gray-900 mt-0.5">
        {payload[0].value} {valueLabel}
      </p>
    </div>
  );
};

/* ── skeleton ────────────────────────────────────────────── */
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

/* ── time ago helper ─────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── main page ───────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<DashboardData>("/api/admin/dashboard/stats");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleReview = (row: PendingAction) => {
    const tab = row.type === "Registration" ? "registration" : "verification";
    router.push(`/requests?tab=${tab}&open=${row.id}`);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const registrationTrends = data?.registrationTrends ?? [];
  const ngosByCity = data?.ngosByCity ?? [];
  const pendingActions = data?.pendingActions ?? [];
  const recentDecisions = data?.recentDecisions ?? [];
  const userGrowth = metrics?.activeUsers?.growth ?? 0;
  const isPositiveGrowth = userGrowth >= 0;

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your platform activity and pending tasks.
        </p>
      </div>

      {/* ── Metric cards (3 columns) ─────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pending Requests */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-36" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Pending Requests
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {metrics?.pendingRequests.total}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <ClockIcon className="h-[18px] w-[18px] text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <span className="text-amber-600 font-medium">
                  {metrics?.pendingRequests.registration}
                </span>{" "}
                registration
                <span className="mx-1.5 text-gray-300">&middot;</span>
                <span className="text-amber-600 font-medium">
                  {metrics?.pendingRequests.verification}
                </span>{" "}
                verification
              </p>
            </>
          )}
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {metrics?.activeUsers.total}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <UsersIcon className="h-[18px] w-[18px] text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {isPositiveGrowth ? (
                  <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-red-500" />
                )}
                <p className="text-xs text-gray-400">
                  <span
                    className={`font-medium ${isPositiveGrowth ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {isPositiveGrowth ? "+" : ""}
                    {userGrowth}
                  </span>{" "}
                  from last month
                </p>
              </div>
            </>
          )}
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Active Projects
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {metrics?.activeProjects.active}
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <BriefcaseIcon className="h-[18px] w-[18px] text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                <span className="text-blue-600 font-medium">
                  {metrics?.activeProjects.total}
                </span>{" "}
                total projects across all charities
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        {/* Registration Trends */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Registration Trends</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 months</p>
            </div>
            <span className="text-xs font-medium text-gray-500 px-2.5 py-1 rounded border border-gray-200 bg-gray-50">
              Monthly
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={registrationTrends} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip labelKey="month" valueLabel="registrations" />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 4.5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* NGOs by City */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">NGOs by City</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading
                ? "..."
                : `${ngosByCity.reduce((a, b) => a + b.count, 0)} total across Lebanon`}
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ngosByCity} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="city" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip
                  content={<ChartTooltip labelKey="city" valueLabel="NGOs" />}
                  cursor={{ fill: "rgba(0,0,0,.02)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ngosByCity.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#2563eb" : i < 3 ? "#3b82f6" : "#93c5fd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom row: Recent Decisions + Pending Actions ─ */}
      <div className="grid grid-cols-5 gap-4">

        {/* Recent Decisions (left — 2 cols) */}
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Decisions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest approvals and declines</p>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentDecisions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">No decisions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDecisions.map((d) => {
                const isApproved = d.status === "APPROVED";
                return (
                  <div key={`${d.type}-${d.id}`} className="flex items-start gap-3 px-5 py-3.5">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isApproved
                          ? "bg-emerald-50 border border-emerald-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {d.org}
                        </p>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                          {timeAgo(d.reviewedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[11px] font-medium ${
                            isApproved ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {d.status}
                        </span>
                        <span className="text-gray-300">&middot;</span>
                        <span className="text-[11px] text-gray-400">{d.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Actions table (right — 3 cols) */}
        <div className="col-span-3 bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pending Actions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Items that need your review</p>
            </div>
            {!loading && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {pendingActions.length} pending
              </span>
            )}
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["ORGANIZATION", "TYPE", "CATEGORY", "SUBMITTED", ""].map((h) => (
                  <th
                    key={h || "actions"}
                    className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-3.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28 mt-1.5" />
                    </td>
                    <td className="px-5 py-3.5"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-7 w-20" /></td>
                  </tr>
                ))
              ) : pendingActions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                    No pending actions — you&apos;re all caught up!
                  </td>
                </tr>
              ) : (
                pendingActions.map((row) => {
                  const rowKey = `${row.type}-${row.id}`;
                  return (
                    <tr
                      key={rowKey}
                      onMouseEnter={() => setHoveredRow(rowKey)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`border-b border-gray-50 transition-colors duration-100 ${
                        hoveredRow === rowKey ? "bg-gray-50/60" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{row.org}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{row.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${typeStyles[row.type]}`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {row.category ? (
                          <span
                            className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${
                              categoryStyles[row.category] || categoryStyles.OTHER
                            }`}
                          >
                            {row.category.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {new Date(row.submitted).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleReview(row)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-md transition-colors cursor-pointer"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}