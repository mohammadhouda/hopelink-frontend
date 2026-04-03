"use client";
import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell, PieChart, Pie,
} from "recharts";
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  UsersIcon,
  BriefcaseIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";
import CustomDropdown from "@/components/CustomDropdown";
import CustomDatePicker from "@/components/CustomDatePicker";

/* types */
type TabKey = "registration" | "ngos" | "users" | "projects";

interface FilterOptions {
  categories: string[];
  cities: string[];
}

interface Filters {
  from: string;
  to: string;
  status: string;
  category: string;
  city: string;
  verified: string;
}

/* ── constants ───────────────────────────────────────────── */
const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "registration", label: "Registration", icon: ClipboardDocumentListIcon },
  { key: "ngos", label: "NGOs", icon: BuildingOfficeIcon },
  { key: "users", label: "Users", icon: UsersIcon },
  { key: "projects", label: "Projects", icon: BriefcaseIcon },
];

const CHART_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];
const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border-red-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

/* ── helpers ─────────────────────────────────────────────── */
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function exportToCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface ChartTipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: Record<string, unknown> }>;
  labelKey: string;
  valueLabel: string;
}

const ChartTip = ({ active, payload, labelKey, valueLabel }: ChartTipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-xs">
      <p className="text-gray-500">{String(payload[0].payload[labelKey])}</p>
      <p className="font-semibold text-gray-900 mt-0.5">{payload[0].value} {valueLabel}</p>
    </div>
  );
};

/* ── Metric Card ─────────────────────────────────────────── */
function MetricCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
    green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className={`text-xs mt-1.5 ${c.text} font-medium`}>{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── MAIN PAGE                                            ── */
/* ══════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("registration");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpts, setFilterOpts] = useState<FilterOptions>({ categories: [], cities: [] });
  const [filters, setFilters] = useState<Filters>({
    from: "", to: "", status: "all", category: "all", city: "all", verified: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch filter options once
  useEffect(() => {
    api.get("/api/admin/report/filters").then((res) => setFilterOpts(res.data)).catch(() => {});
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.category !== "all") params.set("category", filters.category);
      if (filters.city !== "all") params.set("city", filters.city);
      if (filters.verified !== "all") params.set("verified", filters.verified);

      const endpoint = `/api/admin/report/${activeTab}?${params}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error("Report fetch error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const resetFilters = () => {
    setFilters({ from: "", to: "", status: "all", category: "all", city: "all", verified: "all" });
  };

  const d = data as Record<string, any>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze platform data across all sections.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border transition-colors cursor-pointer ${
              showFilters ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-3.5 w-3.5" />
            Filters
          </button>
          <button
            onClick={() => handleExport(activeTab, d)}
            disabled={loading || !d}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter data</p>
            <button onClick={resetFilters} className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer flex items-center gap-1">
              <ArrowPathIcon className="h-3 w-3" /> Reset
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[11px] font-medium text-gray-500 block mb-1">From</label>
              <CustomDatePicker
                value={filters.from}
                onChange={(val) => setFilters({ ...filters, from: val })}
                placeholder="Start date"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-500 block mb-1">To</label>
              <CustomDatePicker
                value={filters.to}
                onChange={(val) => setFilters({ ...filters, to: val })}
                placeholder="End date"
              />
            </div>
            {(activeTab === "registration" || activeTab === "projects") && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Status</label>
                <CustomDropdown
                  value={filters.status}
                  onChange={(val) => setFilters({ ...filters, status: val })}
                  options={[
                    { label: "All", value: "all" },
                    ...(activeTab === "registration"
                      ? [
                          { label: "Pending", value: "PENDING" },
                          { label: "Approved", value: "APPROVED" },
                          { label: "Declined", value: "DECLINED" },
                        ]
                      : [
                          { label: "Active", value: "ACTIVE" },
                          { label: "Paused", value: "PAUSED" },
                          { label: "Closed", value: "CLOSED" },
                        ]),
                  ]}
                />
              </div>
            )}
            {(activeTab === "registration" || activeTab === "ngos" || activeTab === "projects") && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Category</label>
                <CustomDropdown
                  value={filters.category}
                  onChange={(val) => setFilters({ ...filters, category: val })}
                  options={[
                    { label: "All", value: "all" },
                    ...filterOpts.categories.map((c) => ({ label: c, value: c }))
                  ]}
                />
              </div>
            )}
            {(activeTab === "registration" || activeTab === "ngos") && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">City</label>
                <CustomDropdown
                  value={filters.city}
                  onChange={(val) => setFilters({ ...filters, city: val })}
                  options={[
                    { label: "All", value: "all" },
                    ...filterOpts.cities.map((c) => ({ label: c, value: c }))
                  ]}
                />
              </div>
            )}
            {activeTab === "ngos" && (
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Verified</label>
                <CustomDropdown
                  value={filters.verified}
                  onChange={(val) => setFilters({ ...filters, verified: val })}
                  options={[
                    { label: "All", value: "all" },
                    { label: "Verified", value: "verified" },
                    { label: "Unverified", value: "unverified" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {loading ? <LoadingSkeleton /> : d ? (
            <>
              {activeTab === "registration" && <RegistrationTab data={d} />}
              {activeTab === "ngos" && <NgoTab data={d} />}
              {activeTab === "users" && <UserTab data={d} />}
              {activeTab === "projects" && <ProjectTab data={d} />}
            </>
          ) : (
            <div className="text-center py-12 text-sm text-gray-400">Failed to load report data.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Loading skeleton ────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2 p-4 border border-gray-100 rounded-lg">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[220px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── TAB: Registration                                    ── */
/* ══════════════════════════════════════════════════════════ */
function RegistrationTab({ data }: { data: any }) {
  const { summary, byMonth, byCategory, requests } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Requests" value={summary.total} color="blue" />
        <MetricCard label="Approved" value={summary.approved} sub={`${summary.approvalRate}% rate`} color="green" />
        <MetricCard label="Declined" value={summary.declined} color="red" />
        <MetricCard label="Avg. Processing" value={summary.avgProcessingHours ? `${summary.avgProcessingHours}h` : "—"} sub="hours to review" color="amber" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requests Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMonth} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip content={<ChartTip labelKey="label" valueLabel="requests" />} />
              <Bar dataKey="approved" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="declined" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Approved</span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="h-2 w-2 rounded-full bg-red-500" />Declined</span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="h-2 w-2 rounded-full bg-amber-500" />Pending</span>
          </div>
        </div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 11 }} width={90} />
              <Tooltip content={<ChartTip labelKey="category" valueLabel="requests" />} />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={18}>
                {byCategory?.map((_: unknown, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ReportTable
        headers={["Name", "Email", "City", "Category", "Status", "Submitted", "Reviewed", "Reviewer"]}
        rows={requests?.map((r: any) => [
          r.name, r.email, r.city ?? "—", r.category ?? "—", r.status,
          formatDate(r.createdAt), formatDate(r.reviewedAt), r.reviewer?.name ?? "—",
        ]) ?? []}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── TAB: NGOs                                            ── */
/* ══════════════════════════════════════════════════════════ */
function NgoTab({ data }: { data: any }) {
  const { summary, byCategory, byCity, ngos } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total NGOs" value={summary.total} color="blue" />
        <MetricCard label="Verified" value={summary.verified} sub={`${summary.verificationRate}% rate`} color="green" />
        <MetricCard label="Unverified" value={summary.unverified} color="amber" />
        <MetricCard label="Verification Rate" value={`${summary.verificationRate}%`} color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {byCategory?.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {byCategory?.map((c: any, i: number) => (
              <span key={c.category} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.category} ({c.count})
              </span>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">By City</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCity} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="city" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip content={<ChartTip labelKey="city" valueLabel="NGOs" />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byCity?.map((_: unknown, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ReportTable
        headers={["Name", "Email", "City", "Category", "Verified", "Projects", "Registered"]}
        rows={ngos?.map((n: any) => [
          n.name, n.email, n.city ?? "—", n.category ?? "—",
          n.isVerified ? "Yes" : "No", n.projectCount, formatDate(n.createdAt),
        ]) ?? []}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── TAB: Users                                           ── */
/* ══════════════════════════════════════════════════════════ */
function UserTab({ data }: { data: any }) {
  const { summary, byRole, signupsByMonth, users } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Users" value={summary.total} color="blue" />
        <MetricCard label="Active" value={summary.active} color="green" />
        <MetricCard label="Inactive" value={summary.inactive} color="red" />
        <MetricCard label="Roles" value={byRole?.length ?? 0} sub={byRole?.map((r: any) => `${r.role}: ${r.count}`).join(", ")} color="purple" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Signups Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={signupsByMonth} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip content={<ChartTip labelKey="label" valueLabel="signups" />} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2}
                dot={{ r: 3, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Role Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byRole} dataKey="count" nameKey="role" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {byRole?.map((_: unknown, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {byRole?.map((r: any, i: number) => (
              <span key={r.role} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {r.role} ({r.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <ReportTable
        headers={["Name", "Email", "Role", "Status", "Registered", "Last Login"]}
        rows={users?.map((u: any) => [
          u.name, u.email, u.role, u.isActive ? "Active" : "Inactive",
          formatDate(u.createdAt), formatDate(u.lastLoginAt),
        ]) ?? []}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/* ── TAB: Projects                                        ── */
/* ══════════════════════════════════════════════════════════ */
function ProjectTab({ data }: { data: any }) {
  const { summary, byCategory, projectsByMonth, topCharities, projects } = data;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Projects" value={summary.total} color="blue" />
        <MetricCard label="Active" value={summary.active} color="green" />
        <MetricCard label="Paused" value={summary.paused} color="amber" />
        <MetricCard label="Closed" value={summary.closed} color="red" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Projects Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={projectsByMonth} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 10 }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip content={<ChartTip labelKey="label" valueLabel="projects" />} />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2}
                dot={{ r: 3, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Charities</h3>
          <div className="space-y-2.5">
            {topCharities?.map((c: any, i: number) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <span className="text-sm text-gray-700">{c.name}</span>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {c.projectCount} projects
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReportTable
        headers={["Title", "Charity", "Category", "Status", "Applications", "Created"]}
        rows={projects?.map((p: any) => [
          p.title, p.charity, p.category ?? "—", p.status,
          p.applications, formatDate(p.createdAt),
        ]) ?? []}
      />
    </div>
  );
}

/* ── Reusable table ──────────────────────────────────────── */
function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) {
    return <div className="text-center py-8 text-sm text-gray-400">No data for the selected filters.</div>;
  }
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {headers.map((h) => (
              <th key={h} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3 text-sm text-gray-600">
                  {STATUS_STYLES[cell] ? (
                    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLES[cell]}`}>
                      {cell}
                    </span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── CSV export handler ──────────────────────────────────── */
function handleExport(tab: TabKey, data: any) {
  if (!data) return;

  switch (tab) {
    case "registration":
      exportToCsv("registration-report",
        ["Name", "Email", "City", "Category", "Status", "Submitted", "Reviewed", "Reviewer"],
        data.requests?.map((r: any) => [
          r.name, r.email, r.city, r.category, r.status,
          r.createdAt, r.reviewedAt, r.reviewer?.name ?? "",
        ]) ?? []);
      break;
    case "ngos":
      exportToCsv("ngo-report",
        ["Name", "Email", "City", "Category", "Verified", "Projects", "Registered"],
        data.ngos?.map((n: any) => [
          n.name, n.email, n.city, n.category, n.isVerified ? "Yes" : "No",
          n.projectCount, n.createdAt,
        ]) ?? []);
      break;
    case "users":
      exportToCsv("user-report",
        ["Name", "Email", "Role", "Active", "Registered", "Last Login"],
        data.users?.map((u: any) => [
          u.name, u.email, u.role, u.isActive ? "Yes" : "No",
          u.createdAt, u.lastLoginAt ?? "",
        ]) ?? []);
      break;
    case "projects":
      exportToCsv("project-report",
        ["Title", "Charity", "Category", "Status", "Applications", "Created"],
        data.projects?.map((p: any) => [
          p.title, p.charity, p.category, p.status, p.applications, p.createdAt,
        ]) ?? []);
      break;
  }
}