'use client';
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import Loading from "@/app/loading";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  BriefcaseIcon,
  TrashIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import ConfirmModal from "@/components/ConfirmModal";
import { formatDate } from "@/lib/dateUtils";

// Types
interface Project {
  id: number;
  title: string;
  description: string;
  category: string | null;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
  createdAt: string;
  _count?: { applications: number };
}

interface CharityDetail {
  id: number;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  category: string | null;
  isVerified: boolean;
  createdAt: string;
  userId: number;
  user: {
    id: number;
    email: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  };
  charityProjects: Project[];
}

// Helpers
const STATUS_STYLES: Record<Project["status"], string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border border-amber-200",
  CLOSED: "bg-gray-100 text-gray-500 border border-gray-200",
};


// Sub-components
function StatCard({ label, value, icon: Icon, color = "blue" }: {
  label: string; value: string | number; icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    gray:    "bg-gray-100 text-gray-500",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Main Page
export default function CharityDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [charity, setCharity] = useState<CharityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "account">("overview");
  const [modal, setModal] = useState<null | "delete" | "suspend" | "verify" | "revoke">(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get(`/api/admin/charities/${id}`)
      .then((res) => setCharity(res.data.data))
      .catch(() => showToast("Failed to load charity", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const patch = async (payload: Record<string, unknown>, loadingKey: string) => {
    if (!charity) return;
    setActionLoading(loadingKey);
    try {
      const res = await api.patch(`/api/admin/charities/${charity.userId}`, payload);
      // Merge updated fields back into local state
      setCharity((prev) => prev ? { ...prev, ...res.data.data, user: { ...prev.user, ...res.data.data?.user } } : prev);
      return true;
    } catch {
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Verify
  const handleVerify = async () => {
    setModal(null);
    const ok = await patch({ isVerified: true }, "verify");
    if (ok) {
      setCharity((prev) => prev ? { ...prev, isVerified: true } : prev);
      showToast("Charity verified successfully");
    } else {
      showToast("Failed to verify charity", "error");
    }
  };

  // Revoke
  const handleRevoke = async () => {
    setModal(null);
    const ok = await patch({ isVerified: false }, "revoke");
    if (ok) {
      setCharity((prev) => prev ? { ...prev, isVerified: false } : prev);
      showToast("Verification revoked");
    } else {
      showToast("Failed to revoke verification", "error");
    }
  };

  // Suspend / Reactivate
  const handleToggleSuspend = async () => {
    setModal(null);
    const nextActive = !charity?.user.isActive;
    const ok = await patch({ isActive: nextActive }, "suspend");
    if (ok) {
      setCharity((prev) =>
        prev ? { ...prev, user: { ...prev.user, isActive: nextActive } } : prev
      );
      showToast(nextActive ? "Account reactivated" : "Account suspended");
    } else {
      showToast("Action failed", "error");
    }
  };

  // Delete (soft delete by setting isActive to false)
  const handleDelete = async () => {
    setModal(null);
    if (!charity) return;
    setActionLoading("delete");
    try {
      await api.delete(`/api/admin/charities/${charity.userId}`);
      showToast("Charity deleted");
      setTimeout(() => router.push("/admin/ngo"), 1000);
    } catch {
      showToast("Failed to delete charity", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Project status change
  const handleProjectStatus = async (projectId: number, status: Project["status"]) => {
    try {
      await api.patch(`/api/projects/${projectId}/status`, { status });
      setCharity((prev) =>
        prev
          ? { ...prev, charityProjects: prev.charityProjects.map((p) => p.id === projectId ? { ...p, status } : p) }
          : prev
      );
      showToast(`Project ${status.toLowerCase()}`);
    } catch {
      showToast("Failed to update project", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <Loading />;
  if (!charity) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <BuildingOfficeIcon className="h-12 w-12 mb-3 text-gray-300" />
      <p className="text-sm font-medium text-gray-500">Charity not found</p>
    </div>
  );

  const totalApplications = charity.charityProjects.reduce((sum, p) => sum + (p._count?.applications ?? 0), 0);
  const activeProjects = charity.charityProjects.filter((p) => p.status === "ACTIVE").length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === "success" ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-red-200 text-red-600"
        }`}>
          {toast.type === "success"
            ? <CheckCircleSolid className="h-4 w-4 text-emerald-500" />
            : <XCircleIcon className="h-4 w-4 text-red-500" />}
          {toast.msg}
        </div>
      )}

      {/* Modals */}
      {modal === "verify" && (
        <ConfirmModal
          title="Verify this charity?"
          message={`"${charity.name}" will be marked as verified and visible to volunteers.`}
          confirmLabel="Yes, verify"
          confirmClass="bg-emerald-600 hover:bg-emerald-700 text-white"
          onConfirm={handleVerify}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "revoke" && (
        <ConfirmModal
          title="Revoke verification?"
          message={`"${charity.name}" will lose its verified status.`}
          confirmLabel="Revoke"
          confirmClass="bg-amber-500 hover:bg-amber-600 text-white"
          onConfirm={handleRevoke}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "suspend" && (
        <ConfirmModal
          title={charity.user.isActive ? "Suspend account?" : "Reactivate account?"}
          message={charity.user.isActive
            ? "The charity owner won't be able to log in until reactivated."
            : "The charity owner will regain access to their account."}
          confirmLabel={charity.user.isActive ? "Suspend" : "Reactivate"}
          confirmClass={charity.user.isActive ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
          onConfirm={handleToggleSuspend}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "delete" && (
        <ConfirmModal
          title="Delete this charity?"
          message="This is a soft delete, the account will be disabled and the owner won't be able to log in."
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700 text-white"
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mb-4">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to NGOs
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {charity.logoUrl
                  ? <img src={charity.logoUrl} alt={charity.name} className="h-full w-full object-cover" />
                  : <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-gray-900">{charity.name}</h1>
                  {charity.isVerified
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircleSolid className="h-3 w-3" /> Verified
                      </span>
                    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                        <XCircleIcon className="h-3 w-3" /> Unverified
                      </span>}
                  {charity.category && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {charity.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Joined {formatDate(charity.createdAt)}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {charity.isVerified ? (
                <button
                  onClick={() => setModal("revoke")}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Revoke Verification
                </button>
              ) : (
                <button
                  onClick={() => setModal("verify")}
                  disabled={!!actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Verify Charity
                </button>
              )}
              <button
                onClick={() => setModal("suspend")}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {charity.user.isActive
                  ? <><PauseCircleIcon className="h-4 w-4" /> Suspend</>
                  : <><PlayCircleIcon className="h-4 w-4" /> Reactivate</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Projects"     value={charity.charityProjects.length} icon={BriefcaseIcon}    color="blue" />
        <StatCard label="Active Projects"    value={activeProjects}                  icon={CheckCircleIcon}  color="emerald" />
        <StatCard label="Total Applications" value={totalApplications}               icon={UserIcon}         color="blue" />
        <StatCard
          label="Account Status"
          value={charity.user.isActive ? "Active" : "Suspended"}
          icon={charity.user.isActive ? CheckCircleIcon : XCircleIcon}
          color={charity.user.isActive ? "emerald" : "gray"}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["overview", "projects", "account"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "projects" && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                  {charity.charityProjects.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="p-5 space-y-5">
            {charity.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">About</p>
                <p className="text-sm text-gray-700 leading-relaxed">{charity.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact & Location</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: EnvelopeIcon, label: "Email",   value: charity.user.email },
                  { icon: PhoneIcon,    label: "Phone",   value: charity.phone },
                  { icon: MapPinIcon,   label: "City",    value: charity.city },
                  { icon: MapPinIcon,   label: "Address", value: charity.address },
                  { icon: GlobeAltIcon, label: "Website", value: charity.websiteUrl, link: true },
                ].map(({ icon: Icon, label, value, link }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{label}</p>
                        {link
                          ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{value}</a>
                          : <p className="text-sm text-gray-800 truncate">{value}</p>}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
        )}

        {/* Projects */}
        {activeTab === "projects" && (
          <div className="divide-y divide-gray-50">
            {charity.charityProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BriefcaseIcon className="h-10 w-10 mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No projects yet</p>
              </div>
            ) : (
              charity.charityProjects.map((project) => (
                <div key={project.id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-medium text-gray-900">{project.title}</p>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[project.status]}`}>
                        {project.status}
                      </span>
                      {project.category && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {formatDate(project.createdAt)}
                      </span>
                      {project._count !== undefined && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5" />
                          {project._count.applications} applicants
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {project.status === "ACTIVE" && (
                      <button onClick={() => handleProjectStatus(project.id, "PAUSED")} className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer">
                        Pause
                      </button>
                    )}
                    {project.status === "PAUSED" && (
                      <button onClick={() => handleProjectStatus(project.id, "ACTIVE")} className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer">
                        Resume
                      </button>
                    )}
                    {project.status !== "CLOSED" && (
                      <button onClick={() => handleProjectStatus(project.id, "CLOSED")} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                        Close
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Account */}
        {activeTab === "account" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Email",          value: charity.user.email },
                { label: "User ID",        value: `#${charity.user.id}` },
                { label: "Account Status", value: charity.user.isActive ? "Active" : "Suspended" },
                { label: "Last Login",     value: formatDate(charity.user.lastLoginAt) },
                { label: "Member Since",   value: formatDate(charity.user.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setModal("delete")}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Charity
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}