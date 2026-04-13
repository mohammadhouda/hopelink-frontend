/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  SparklesIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import charityApi from "@/lib/charityAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";
import { APPLICATION_STATUS, OPPORTUNITY_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";

/* ── types ────────────────────────────────────────────────── */
interface Opportunity {
  id: number;
  title: string;
  description?: string;
  status: string;
  maxSlots: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  projectId?: number;
  project?: { id: number; title: string } | null;
  _count?: { applications: number };
}

interface Application {
  id: number;
  message?: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  userId: number;
  opportunityId: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    baseProfile: { avatarUrl: string; city: string; phone: string } | null;
    volunteerProfile: { experience: string; isVerified: boolean } | null;
  };
  opportunity: {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
  };
}

/* ── constants ────────────────────────────────────────────── */
const APP_STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING:  ClockIcon,
  APPROVED: CheckCircleIcon,
  DECLINED: XCircleIcon,
};

// APPLICATION_STATUS and OPPORTUNITY_STATUS imported from @/lib/constants
// formatDate imported from @/lib/dateUtils

/* ── helpers ──────────────────────────────────────────────── */
function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Ended";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff} days`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function resolveAvatar(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : getAvatarUrl(url);
}

/* ── skeleton ─────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-start gap-6">
          <div className="flex-1 space-y-3">
            <div className="h-7 w-64 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-full max-w-md bg-gray-50 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-50 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50">
            <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                */
/* ══════════════════════════════════════════════════════════ */
export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = () => {
    Promise.all([
      charityApi.get(`/api/charity/opportunities/${id}`),
      charityApi.get(`/api/charity/applications?opportunityId=${id}`),
    ]).then(([oRes, aRes]) => {
      setOpp(oRes.data?.data || null);
      setApplications(aRes.data?.data?.applications || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleApprove = async (appId: number) => {
    setActionLoading(appId);
    try {
      await charityApi.patch(`/api/charity/applications/${appId}/approve`);
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!declineId) return;
    setActionLoading(declineId);
    try {
      await charityApi.patch(`/api/charity/applications/${declineId}/decline`, { reason: declineReason });
      setDeclineId(null);
      setDeclineReason("");
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = statusFilter === "ALL"
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  const approvedCount = applications.filter((a) => a.status === "APPROVED").length;
  const pendingCount = applications.filter((a) => a.status === "PENDING").length;

  if (loading) return <PageSkeleton />;

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <BriefcaseIcon className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">Opportunity not found</p>
        <button onClick={() => router.push("/charity/opportunities")} className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">
          ← Back to opportunities
        </button>
      </div>
    );
  }

  const oppStatus = OPPORTUNITY_STATUS[opp.status] || OPPORTUNITY_STATUS.OPEN;
  const countdown = daysUntil(opp.startDate);
  const slotsRemaining = Math.max(0, opp.maxSlots - approvedCount);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back nav */}
      <button
        onClick={() => router.push("/charity/opportunities")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer group"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Opportunities
      </button>

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1 ${opp.status === "OPEN" ? "bg-gradient-to-r from-emerald-400 to-teal-400" : opp.status === "ENDED" ? "bg-gradient-to-r from-slate-300 to-slate-400" : "bg-gradient-to-r from-blue-300 to-blue-400"}`} />

        <div className="p-7">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Status + project breadcrumb */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${oppStatus.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${oppStatus.dot}`} />
                  {opp.status}
                </span>
                {opp.project && (
                  <>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => router.push(`/charity/projects/${opp.project!.id}`)}
                      className="text-[11px] font-medium text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {opp.project.title}
                    </button>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{opp.title}</h1>

              {/* Description */}
              {opp.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-2.5 max-w-xl">{opp.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {opp.status !== "ENDED" && (
                <button
                  onClick={() => router.push(`/charity/rooms/${opp.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-sm shadow-emerald-200 transition-all cursor-pointer"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  Chat Room
                </button>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 mt-7">
            <StatCard
              icon={UserGroupIcon}
              label="Slots"
              value={`${approvedCount} / ${opp.maxSlots}`}
              sub={slotsRemaining > 0 ? `${slotsRemaining} remaining` : "Full"}
              color={slotsRemaining > 0 ? "emerald" : "amber"}
            />
            <StatCard
              icon={CalendarDaysIcon}
              label="Start Date"
              value={formatDate(opp.startDate)}
              sub={countdown}
              color="blue"
            />
            <StatCard
              icon={CalendarDaysIcon}
              label="End Date"
              value={formatDate(opp.endDate)}
              color="slate"
            />
            <StatCard
              icon={MapPinIcon}
              label="Location"
              value={opp.location || "Not set"}
              color="gray"
            />
          </div>
        </div>
      </div>

      {/* ── Applications section ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">Applications</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {applications.length}
            </span>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
            {(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No applications found</p>
            <p className="text-xs text-gray-300 mt-1">
              {statusFilter !== "ALL" ? "Try a different filter" : "Applications will appear here when volunteers apply"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((a) => {
              const config = APPLICATION_STATUS[a.status] || APPLICATION_STATUS.PENDING;
              const StatusIcon = APP_STATUS_ICONS[a.status] || ClockIcon;
              const avatar = resolveAvatar(a.user.baseProfile?.avatarUrl);
              const isExpanded = expandedApp === a.id;

              return (
                <div key={a.id} className="group">
                  {/* Main row */}
                  <div
                    className={`px-7 py-4 flex items-center gap-4 transition-colors cursor-pointer ${
                      isExpanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"
                    }`}
                    onClick={() => setExpandedApp(isExpanded ? null : a.id)}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {avatar ? (
                        <img src={avatar} alt={a.user.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center ring-2 ring-white">
                          <span className="text-xs font-bold text-white">{getInitials(a.user.name)}</span>
                        </div>
                      )}
                      {a.user.volunteerProfile?.isVerified && (
                        <CheckCircleSolid className="h-4 w-4 text-emerald-500 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{a.user.name}</p>
                        {a.user.volunteerProfile?.isVerified && (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{a.user.email}</p>
                    </div>

                    {/* Applied date */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Applied</p>
                      <p className="text-xs font-medium text-gray-600">{formatShortDate(a.createdAt)}</p>
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ${config.badge}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>

                    {/* Actions */}
                    {a.status === "PENDING" && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprove(a.id)}
                          disabled={actionLoading === a.id}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                        >
                          {actionLoading === a.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => setDeclineId(a.id)}
                          disabled={actionLoading === a.id}
                          className="px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Expand indicator */}
                    <EllipsisHorizontalIcon className={`h-4 w-4 text-gray-300 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="px-7 pb-5 pt-1 bg-gray-50/40">
                      <div className="ml-14 grid grid-cols-2 gap-x-8 gap-y-3">
                        {/* Contact info */}
                        {a.user.baseProfile?.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">{a.user.baseProfile.phone}</span>
                          </div>
                        )}
                        {a.user.baseProfile?.city && (
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">{a.user.baseProfile.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">{a.user.email}</span>
                        </div>
                        {a.user.volunteerProfile?.experience && (
                          <div className="flex items-start gap-2 col-span-2">
                            <SparklesIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                            <span className="text-xs text-gray-600">{a.user.volunteerProfile.experience}</span>
                          </div>
                        )}

                        {/* Application message */}
                        {a.message && (
                          <div className="col-span-2 mt-2 bg-white rounded-xl border border-gray-100 p-3.5">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Application Message</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{a.message}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Decline modal ─────────────────────────────────── */}
      {declineId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Red top bar */}
            <div className="h-1 bg-gradient-to-r from-red-400 to-red-500" />

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Decline Application</h2>
                  <p className="text-xs text-gray-400 mt-0.5">This action will notify the volunteer</p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none resize-none transition-all"
                  placeholder="Let them know why..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setDeclineId(null); setDeclineReason(""); }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={actionLoading === declineId}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {actionLoading === declineId ? "Declining..." : "Decline"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stat card component ──────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string | null;
  color: string;
}) {
  const colorMap: Record<string, { iconBg: string; iconText: string; subText: string }> = {
    emerald: { iconBg: "bg-emerald-50 border-emerald-100", iconText: "text-emerald-500", subText: "text-emerald-600" },
    blue: { iconBg: "bg-blue-50 border-blue-100", iconText: "text-blue-500", subText: "text-blue-600" },
    amber: { iconBg: "bg-amber-50 border-amber-100", iconText: "text-amber-500", subText: "text-amber-600" },
    slate: { iconBg: "bg-slate-50 border-slate-100", iconText: "text-slate-400", subText: "text-slate-500" },
    gray: { iconBg: "bg-gray-50 border-gray-100", iconText: "text-gray-400", subText: "text-gray-500" },
  };

  const c = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center ${c.iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${c.iconText}`} />
        </div>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      {sub && <p className={`text-[11px] font-medium mt-0.5 ${c.subText}`}>{sub}</p>}
    </div>
  );
}