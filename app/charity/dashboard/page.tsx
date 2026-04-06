"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  UsersIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  DocumentCheckIcon,
  FolderIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";

interface Analytics {
  projects: { total: number; active: number; paused: number };
  opportunities: { total: number; open: number; ended: number };
  applications: { total: number; pending: number; approved: number; declined: number; last30Days: number };
  volunteers: { total: number; averageRating: number; totalRatings: number };
  certificates: { issued: number };
  recentOpportunities: {
    id: number;
    title: string;
    status: string;
    maxSlots: number;
    startDate: string;
    endDate: string;
    _count: { applications: number; ratings: number; certificates: number };
  }[];
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const OPP_STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ENDED: "bg-blue-50 text-blue-700 border-blue-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
  FULL: "bg-amber-50 text-amber-700 border-amber-200",
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: Record<string, unknown> }>;
  labelKey: string;
  valueLabel: string;
}
const ChartTooltip = ({ active, payload, labelKey, valueLabel }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="text-gray-500">{String(payload[0].payload[labelKey])}</p>
      <p className="font-semibold text-gray-900 mt-0.5">{payload[0].value} {valueLabel}</p>
    </div>
  );
};


export default function CharityDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    charityApi.get("/api/charity/analytics")
      .then((res) => setData(res.data?.data || res.data))
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const metrics = [
    { label: "Total Volunteers", value: data?.volunteers.total, icon: UsersIcon, color: "emerald" },
    { label: "Active Opportunities", value: data?.opportunities.open, icon: CalendarIcon, color: "teal" },
    { label: "Pending Applications", value: data?.applications.pending, icon: ClipboardDocumentListIcon, color: "amber" },
    { label: "Certificates Issued", value: data?.certificates.issued, icon: DocumentCheckIcon, color: "blue" },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
    teal: "bg-teal-50 border-teal-200 text-teal-600",
    amber: "bg-amber-50 border-amber-200 text-amber-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
  };

  const appChartData = data ? [
    { status: "Pending", count: data.applications.pending },
    { status: "Approved", count: data.applications.approved },
    { status: "Declined", count: data.applications.declined },
  ] : [];

  const oppChartData = data ? [
    { status: "Open", count: data.opportunities.open },
    { status: "Ended", count: data.opportunities.ended },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your charity activity and volunteer engagement.</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-5">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-8 w-14" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</p>
                    <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${colorMap[m.color]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{m.value ?? 0}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Rating + projects summary */}
{!loading && data && (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Avg Rating */}
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Rating</span>
        <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
          <StarIcon className="h-4 w-4 text-amber-500" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-gray-900 tracking-tight">
        {data.volunteers.averageRating ? data.volunteers.averageRating.toFixed(1) : "—"}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        from {data.volunteers.totalRatings} ratings
      </p>
    </div>

    {/* Projects */}
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Projects</span>
        <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <FolderIcon className="h-4 w-4 text-violet-500" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-gray-900 tracking-tight">{data.projects.total}</p>
      <p className="text-xs text-gray-400 mt-1">total projects</p>
    </div>

    {/* Approved */}
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Approved</span>
        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-emerald-600 tracking-tight">{data.applications.approved}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="inline-flex items-center text-xs text-gray-400">
          <span className="text-red-400 font-medium">{data.applications.declined}</span>&nbsp;declined
        </span>
      </div>
    </div>

    {/* Last 30 Days */}
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Last 30 Days</span>
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <CalendarIcon className="h-4 w-4 text-blue-500" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-gray-900 tracking-tight">{data.applications.last30Days}</p>
      <p className="text-xs text-gray-400 mt-1">applications</p>
    </div>
  </div>
)}

      {/* Charts */}
      <div className="grid grid-cols-5 gap-4">
        {/* Applications by status */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Applications by Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pending · Approved · Declined</p>
          </div>
          {loading ? (
            <Skeleton className="h-50 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={appChartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barCategoryGap="36%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip labelKey="status" valueLabel="applications" />} cursor={{ fill: "rgba(0,0,0,.02)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#10b981" />

              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Opportunities by status */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Opportunities</h2>
            <p className="text-xs text-gray-400 mt-0.5">Open · Ended</p>
          </div>
          {loading ? (
            <Skeleton className="h-50 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={oppChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="36%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip labelKey="status" valueLabel="opportunities" />} cursor={{ fill: "rgba(0,0,0,.02)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent opportunities */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Recent Opportunities</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest activity across your opportunities</p>
          </div>
          <button
            onClick={() => router.push("/charity/opportunities")}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
          >
            View all
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["TITLE", "STATUS", "SLOTS", "APPLICATIONS"].map((h) => (
                <th key={h} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3"><Skeleton className="h-4 w-44" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4 w-8" /></td>
                </tr>
              ))
            ) : !data?.recentOpportunities?.length ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-sm text-gray-400">
                  No opportunities yet
                </td>
              </tr>
            ) : (
              data.recentOpportunities.map((opp) => (
                <tr
                  key={opp.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/charity/opportunities/${opp.id}`)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors">
                    {opp.title}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${OPP_STATUS_STYLE[opp.status] ?? ""}`}>
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{opp.maxSlots}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{opp._count.applications}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
