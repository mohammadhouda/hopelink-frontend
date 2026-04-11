"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, StopCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import ConfirmModal from "@/components/ConfirmModal";
import Dropdown from "@/components/charity/Dropdown";
import CustomDatePicker from "@/components/CustomDatePicker";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as const;
const DAY_SHORT: Record<string, string> = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat", SUNDAY:"Sun" };

interface Opportunity {
  id: number;
  title: string;
  description?: string;
  status: "OPEN" | "CLOSED" | "ENDED" | "FULL";
  maxSlots: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  requiredSkills: string[];
  availabilityDays: string[];
  projectId?: number;
  createdAt: string;
  project?: { id: number; title: string } | null;
  _count?: { applications: number };
}

interface Project {
  id: number;
  title: string;
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
  ENDED: "bg-blue-50 text-blue-700 border-blue-200",
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function OpportunitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editOpp, setEditOpp] = useState<Opportunity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null);
  const [endTarget, setEndTarget] = useState<Opportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", slots: "1", date: "", location: "", projectId: "",
    requiredSkills: [] as string[], availabilityDays: [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");

const fetchData = () => {
  setLoading(true);
  Promise.all([
    charityApi.get("/api/charity/opportunities"),
    charityApi.get("/api/charity/projects"),
  ]).then(([oRes, pRes]) => {
    setOpportunities(oRes.data?.data?.opportunities || []);
    setProjects(pRes.data?.data?.projects || []);
  }).finally(() => setLoading(false));
};

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (projectId) {
      setEditOpp(null);
      setForm({ title: "", description: "", slots: "1", date: "", location: "", projectId, requiredSkills: [], availabilityDays: [] });
      setShowForm(true);
    }
  }, [searchParams]);

  const openCreate = () => {
    setEditOpp(null);
    setForm({ title: "", description: "", slots: "1", date: "", location: "", projectId: "", requiredSkills: [], availabilityDays: [] });
    setNewSkill("");
    setShowForm(true);
  };

  const openEdit = (o: Opportunity) => {
    setEditOpp(o);
    setForm({
      title: o.title,
      description: o.description || "",
      slots: String(o.maxSlots),
      date: o.startDate ? o.startDate.slice(0, 10) : "",
      location: o.location || "",
      projectId: o.projectId ? String(o.projectId) : "",
      requiredSkills: o.requiredSkills || [],
      availabilityDays: o.availabilityDays || [],
    });
    setNewSkill("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        maxSlots: parseInt(form.slots),
        projectId: form.projectId ? parseInt(form.projectId) : undefined,
        startDate: form.date || undefined,
      };
      if (editOpp) {
        await charityApi.patch(`/api/charity/opportunities/${editOpp.id}`, payload);
      } else {
        await charityApi.post("/api/charity/opportunities", payload);
      }
      setShowForm(false);
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

const handleDelete = async () => {
  if (!deleteTarget) return;
  try {
    await charityApi.delete(`/api/charity/opportunities/${deleteTarget.id}`);
    setDeleteTarget(null);
    fetchData();
  } catch (err) {
    console.error("Delete opportunity error:", err);
    setDeleteTarget(null);
  }
};

const handleEnd = async () => {
  if (!endTarget) return;
  try {
    await charityApi.patch(`/api/charity/opportunities/${endTarget.id}/end`);
    setEndTarget(null);
    fetchData();
  } catch (err) {
    console.error("End opportunity error:", err);
    setEndTarget(null);
  }
};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Post volunteering opportunities and manage slots.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> New Opportunity
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["TITLE", "STATUS", "SLOTS", "DATE", "LOCATION", ""].map((h) => (
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
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-44" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-8" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-7 w-20" /></td>
                </tr>
              ))
            ) : opportunities.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No opportunities yet.</p>
                </td>
              </tr>
            ) : (
              opportunities.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p
                      className="text-sm font-medium text-gray-900 hover:text-emerald-600 cursor-pointer"
                      onClick={() => router.push(`/charity/opportunities/${o.id}`)}
                    >
                      {o.title}
                    </p>
                    {o.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{o.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{o.maxSlots}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{o.location || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {o.status === "OPEN" && (
                        <button
                          onClick={() => setEndTarget(o)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
                          title="End opportunity"
                        >
                          <StopCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(o)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(o)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-base font-bold text-gray-900">
                {editOpp ? "Edit Opportunity" : "New Opportunity"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <FormField label="Title" required>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="modal-input" placeholder="Opportunity title" />
              </FormField>
              <FormField label="Description">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="modal-input resize-none" placeholder="Describe the opportunity..." />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Slots" required>
                  <input type="number" min="1" value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} required className="modal-input" />
                </FormField>
                <FormField label="Date">
                  <CustomDatePicker value={form.date} onChange={(v) => setForm({ ...form, date: v })} placeholder="Pick a date" className="w-full" />
                </FormField>
              </div>
              <FormField label="Location">
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="modal-input" placeholder="City or address" />
              </FormField>
              {/* Required Skills */}
              <FormField label="Required Skills">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 min-h-7">
                    {form.requiredSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {skill}
                        <button type="button" onClick={() => setForm({ ...form, requiredSkills: form.requiredSkills.filter((s) => s !== skill) })} className="hover:text-red-500 cursor-pointer"><XMarkIcon className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const s = newSkill.trim(); if (s && !form.requiredSkills.includes(s)) { setForm({ ...form, requiredSkills: [...form.requiredSkills, s] }); setNewSkill(""); } } }}
                      placeholder="Add skill (press Enter)"
                      className="modal-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => { const s = newSkill.trim(); if (s && !form.requiredSkills.includes(s)) { setForm({ ...form, requiredSkills: [...form.requiredSkills, s] }); setNewSkill(""); } }}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </FormField>

              {/* Availability Days */}
              <FormField label="Available Days">
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS.map((day) => {
                    const active = form.availabilityDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setForm({ ...form, availabilityDays: active ? form.availabilityDays.filter((d) => d !== day) : [...form.availabilityDays, day] })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${active ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"}`}
                      >
                        {DAY_SHORT[day]}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField label="Project (optional)">
                <Dropdown
                  value={form.projectId}
                  onChange={(v) => setForm({ ...form, projectId: v })}
                  options={[
                    { value: "", label: "None" },
                    ...projects.map((p) => ({ value: String(p.id), label: p.title })),
                  ]}
                />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60">
                  {submitting ? "Saving..." : editOpp ? "Save changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Opportunity"
          message={`Delete "${deleteTarget.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="text-white bg-red-500 hover:bg-red-600"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {endTarget && (
        <ConfirmModal
          title="End Opportunity"
          message={`End "${endTarget.title}"? This will close the volunteer room and prevent new applications.`}
          confirmLabel="End Opportunity"
          confirmClass="text-white bg-red-500 hover:bg-red-600"
          onConfirm={handleEnd}
          onCancel={() => setEndTarget(null)}
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
