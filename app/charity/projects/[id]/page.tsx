"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  FolderIcon,
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  SparklesIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import { formatDate } from "@/lib/dateUtils";

/* ── types ────────────────────────────────────────────────── */
interface Project {
  id: number;
  title: string;
  description?: string;
  status: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  _count?: { opportunities: number; applications: number };
}

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
  _count?: { applications: number };
}

/* ── constants ────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  COMPLETED: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  PAUSED: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

const OPP_STATUS_CONFIG: Record<string, { bg: string; dot: string }> = {
  OPEN: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  FULL: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  CLOSED: { bg: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  ENDED: { bg: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const ACCENT_MAP: Record<string, string> = {
  ACTIVE: "bg-gradient-to-r from-emerald-400 to-teal-400",
  COMPLETED: "bg-gradient-to-r from-blue-400 to-indigo-400",
  PAUSED: "bg-gradient-to-r from-amber-400 to-orange-400",
};

/* ── helpers ──────────────────────────────────────────────── */

function daysRemaining(endDate?: string | null) {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Ended";
  if (diff === 0) return "Ends today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

function duration(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return null;
  if (diff < 7) return `${diff} days`;
  if (diff < 30) return `${Math.ceil(diff / 7)} weeks`;
  return `${Math.ceil(diff / 30)} months`;
}

/* ── skeleton ─────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="space-y-3">
          <div className="h-7 w-56 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-md bg-gray-50 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-3 mt-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-5" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse mb-3" />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                */
/* ══════════════════════════════════════════════════════════ */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      charityApi.get(`/api/charity/projects/${id}`),
      charityApi.get(`/api/charity/opportunities?projectId=${id}`),
    ])
      .then(([pRes, oRes]) => {
        setProject(pRes.data?.data || null);
        setOpportunities(oRes.data?.data?.opportunities || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <FolderIcon className="h-8 w-8 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-500">Project not found</p>
        <button onClick={() => router.push("/charity/projects")} className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">
          ← Back to projects
        </button>
      </div>
    );
  }

  const projectStatus = STATUS_CONFIG[project.status] || STATUS_CONFIG.ACTIVE;
  const accentBar = ACCENT_MAP[project.status] || ACCENT_MAP.ACTIVE;
  const totalApps = opportunities.reduce((sum, o) => sum + (o._count?.applications || 0), 0);
  const totalSlots = opportunities.reduce((sum, o) => sum + o.maxSlots, 0);
  const openOpps = opportunities.filter((o) => o.status === "OPEN").length;
  const projectDuration = duration(project.startDate, project.endDate);
  const remaining = daysRemaining(project.endDate);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back nav */}
      <button
        onClick={() => router.push("/charity/projects")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer group"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Projects
      </button>

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Top accent */}
        <div className={`h-1 ${accentBar}`} />

        <div className="p-7">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              {/* Status + category */}
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${projectStatus.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${projectStatus.dot}`} />
                  {project.status}
                </span>
                {project.category && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] font-medium text-gray-400">{project.category}</span>
                  </>
                )}
                {remaining && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <ClockIcon className="h-3 w-3" />
                      {remaining}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{project.title}</h1>

              {/* Description */}
              {project.description && (
                <p className="text-sm text-gray-500 leading-relaxed mt-2.5 max-w-xl">{project.description}</p>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => router.push(`/charity/opportunities?projectId=${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-sm shadow-emerald-200 transition-all cursor-pointer shrink-0"
            >
              <PlusIcon className="h-4 w-4" />
              New Opportunity
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 mt-7">
            <StatCard
              icon={SparklesIcon}
              label="Opportunities"
              value={opportunities.length}
              sub={openOpps > 0 ? `${openOpps} open` : "None open"}
              color="emerald"
            />
            <StatCard
              icon={UserGroupIcon}
              label="Applications"
              value={totalApps}
              sub={`${totalSlots} total slots`}
              color="blue"
            />
            <StatCard
              icon={CalendarDaysIcon}
              label="Start Date"
              value={formatDate(project.startDate)}
              sub={projectDuration ? `Duration: ${projectDuration}` : undefined}
              color="slate"
            />
            <StatCard
              icon={CalendarDaysIcon}
              label="End Date"
              value={formatDate(project.endDate)}
              sub={remaining && remaining !== "Ended" ? remaining : undefined}
              color="gray"
            />
          </div>
        </div>
      </div>

      {/* ── Opportunities section ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">Opportunities</h2>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {opportunities.length}
            </span>
          </div>
          <button
            onClick={() => router.push("/charity/opportunities")}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
          >
            Manage all
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Empty state */}
        {opportunities.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDaysIcon className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No opportunities linked yet</p>
            <p className="text-xs text-gray-300 mt-1">Create an opportunity and assign it to this project</p>
            <button
              onClick={() => router.push("/charity/opportunities")}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Create Opportunity
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {opportunities.map((o) => {
              const oppStatus = OPP_STATUS_CONFIG[o.status] || OPP_STATUS_CONFIG.OPEN;
              const appCount = o._count?.applications || 0;

              return (
                <div
                  key={o.id}
                  onClick={() => router.push(`/charity/opportunities/${o.id}`)}
                  className="px-7 py-4 flex items-center gap-5 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                  {/* Icon */}
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    o.status === "OPEN" ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"
                  }`}>
                    <CalendarDaysIcon className={`h-5 w-5 ${o.status === "OPEN" ? "text-emerald-500" : "text-gray-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                      {o.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {o.location && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <MapPinIcon className="h-3 w-3" />
                          {o.location}
                        </span>
                      )}
                      {o.startDate && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <CalendarDaysIcon className="h-3 w-3" />
                          {formatDate(o.startDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Slots</p>
                      <p className="text-sm font-semibold text-gray-700">{o.maxSlots}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${oppStatus.bg}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${oppStatus.dot}`} />
                      {o.status}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ────────────────────────────────────────────── */
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