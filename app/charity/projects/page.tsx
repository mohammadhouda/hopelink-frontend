"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon, TrashIcon, FolderIcon, FunnelIcon } from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import ConfirmModal from "@/components/ConfirmModal";
import Dropdown from "@/components/charity/Dropdown";
import CustomDatePicker from "@/components/CustomDatePicker";

interface Project {
  id: number;
  title: string;
  description?: string;
  status: "ACTIVE" | "CLOSED" | "PAUSED";
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "ACTIVE", startDate: "", endDate: "" });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchProjects = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (dateFrom) params.set("startFrom", dateFrom);
    if (dateTo) params.set("startTo", dateTo);
    charityApi.get(`/api/charity/projects?${params}`)
      .then((res) => setProjects(res.data?.data?.projects || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, [statusFilter, dateFrom, dateTo]);

  const openCreate = () => {
    setEditProject(null);
    setForm({ title: "", description: "", status: "ACTIVE", startDate: "", endDate: "" });
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setForm({
      title: p.title,
      description: p.description || "",
      status: p.status,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editProject) {
        await charityApi.patch(`/api/charity/projects/${editProject.id}`, form);
      } else {
        await charityApi.post("/api/charity/projects", form);
      }
      setShowForm(false);
      fetchProjects();
    } finally {
      setSubmitting(false);
    }
  };

const handleDelete = async () => {
  if (!deleteTarget) return;
  try {
    await charityApi.delete(`/api/charity/projects/${deleteTarget.id}`);
    setDeleteTarget(null);
    fetchProjects();
  } catch (err) {
    console.error("Delete error:", err);
    setDeleteTarget(null);
  }
};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your charity&apos;s projects and initiatives.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <div className="flex gap-1">
          {(["ALL", "ACTIVE", "PAUSED", "CLOSED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === s ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <CustomDatePicker value={dateFrom} onChange={setDateFrom} placeholder="From" className="w-36" />
        <span className="text-xs text-gray-400">→</span>
        <CustomDatePicker value={dateTo} onChange={setDateTo} placeholder="To" className="w-36" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["TITLE", "STATUS", "START DATE", "END DATE", "CREATED", ""].map((h) => (
                <th key={h || "a"} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56 mt-1.5" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-7 w-16" /></td>
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <FolderIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No projects yet. Create your first one!</p>
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p
                      className="text-sm font-medium text-gray-900 hover:text-emerald-600 cursor-pointer"
                      onClick={() => router.push(`/charity/projects/${p.id}`)}
                    >
                      {p.title}
                    </p>
                    {p.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{p.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {p.startDate ? new Date(p.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {p.endDate ? new Date(p.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">
                {editProject ? "Edit Project" : "New Project"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <FormField label="Title" required>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="modal-input"
                  placeholder="Project title"
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="modal-input resize-none"
                  placeholder="Optional description..."
                />
              </FormField>
              <FormField label="Status">
                <Dropdown
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "PAUSED", label: "Paused" },
                    { value: "CLOSED", label: "Closed" },
                  ]}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Date">
                  <CustomDatePicker value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} placeholder="Pick start date" className="w-full" />
                </FormField>
                <FormField label="End Date">
                  <CustomDatePicker value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} placeholder="Pick end date" className="w-full" />
                </FormField>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60">
                  {submitting ? "Saving..." : editProject ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="text-white bg-red-500 hover:bg-red-600"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <style jsx global>{`
        .modal-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.625rem;
          outline: none;
          transition: all 0.15s;
        }
        .modal-input:focus {
          background: #fff;
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(52,211,153,0.15);
        }
      `}</style>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
