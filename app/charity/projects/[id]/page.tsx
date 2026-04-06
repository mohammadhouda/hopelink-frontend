"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, CalendarIcon } from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";

interface Project {
  id: number;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
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

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
  ENDED: "bg-blue-50 text-blue-700 border-blue-200",
};

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

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded" />
        <div className="animate-pulse h-40 w-full bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-sm text-gray-500 p-6">Project not found.</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push("/charity/projects")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to Projects
      </button>

      {/* Project card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[project.status]}`}>
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-gray-600 leading-relaxed max-w-lg">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-6 mt-5 pt-5 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Start Date</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              {project.startDate ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">End Date</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              {project.endDate ? new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Created</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Opportunities</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{opportunities.length}</p>
          </div>
        </div>
      </div>

      {/* Opportunities under this project */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Opportunities</h2>
          <button
            onClick={() => router.push("/charity/opportunities")}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
          >
            Manage all
          </button>
        </div>
        {opportunities.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No opportunities linked to this project.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["TITLE", "STATUS", "SLOTS", "DATE"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/charity/opportunities/${o.id}`)}
                >
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{o.title}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{o.maxSlots}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {o.startDate
                      ? new Date(o.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
