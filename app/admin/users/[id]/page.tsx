'use client';
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import Loading from "@/app/loading";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeftIcon, UserIcon, EnvelopeIcon, PhoneIcon,
  MapPinIcon, ClockIcon, BriefcaseIcon,
  ExclamationTriangleIcon, TrashIcon, PauseCircleIcon,
  PlayCircleIcon, XCircleIcon, CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// ── Types──
interface Application {
  id: number;
  message: string | null;
  createdAt: string;
  charityProject: {
    id: number;
    title: string;
    status: "ACTIVE" | "PAUSED" | "CLOSED";
    charity: { name: string };
  };
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: "USER" | "VOLUNTEER";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  baseProfile: {
    phone: string | null;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
    bio: string | null;
  } | null;
  volunteerProfile: {
    isAvailable: boolean;
    availabilityNote: string | null;
    experience: string | null;
    isVerified: boolean;
    skills: { skill: string }[];
    preferences: { type: string; value: string }[];
  } | null;
  applications: Application[];
}

// ── Helpers
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border border-amber-200",
  CLOSED: "bg-gray-100 text-gray-500 border border-gray-200",
};

const AVATAR_BG: Record<string, string> = {
  USER:      "bg-blue-100 text-blue-700",
  VOLUNTEER: "bg-emerald-100 text-emerald-700",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = "blue" }: {
  label: string; value: string | number; icon: React.ElementType; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:    "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    gray:    "bg-gray-100 text-gray-500",
    amber:   "bg-amber-50 text-amber-600",
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

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string; confirmClass: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 m-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">Cancel</button>
          <button type="button" onClick={onConfirm} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "account">("overview");
  const [modal, setModal] = useState<null | "suspend">(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get(`/api/users/${id}`)
      .then((res) => setUser(res.data.data))
      .catch(() => showToast("Failed to load user", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleToggleSuspend = async () => {
    setModal(null);
    if (!user) return;
    const nextActive = !user.isActive;
    setActionLoading("suspend");
    try {
      await api.patch(`/api/users/${id}`, { isActive: nextActive });
      setUser((prev) => prev ? { ...prev, isActive: nextActive } : prev);
      showToast(nextActive ? "Account reactivated" : "Account suspended");
    } catch {
      showToast("Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading />;
  if (!user) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <UserIcon className="h-12 w-12 mb-3 text-gray-300" />
      <p className="text-sm font-medium text-gray-500">User not found</p>
    </div>
  );

  const activeApplications = user.applications.filter((a) => a.charityProject.status === "ACTIVE").length;

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
      {modal === "suspend" && (
        <ConfirmModal
          title={user.isActive ? "Suspend account?" : "Reactivate account?"}
          message={user.isActive
            ? `${user.name} won't be able to log in until reactivated.`
            : `${user.name} will regain access to their account.`}
          confirmLabel={user.isActive ? "Suspend" : "Reactivate"}
          confirmClass={user.isActive ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
          onConfirm={handleToggleSuspend}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Back + Header */}
      <div>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer mb-4">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Users
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-semibold ${AVATAR_BG[user.role]}`}>
                {initials(user.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-gray-900">{user.name}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    user.role === "VOLUNTEER"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>
                    {user.role === "VOLUNTEER" ? "Volunteer" : "User"}
                  </span>
                  {!user.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Joined {formatDate(user.createdAt)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setModal("suspend")}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {user.isActive
                  ? <><PauseCircleIcon className="h-4 w-4" /> Suspend</>
                  : <><PlayCircleIcon className="h-4 w-4" /> Reactivate</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Applications"        value={user.applications.length} icon={BriefcaseIcon}   color="blue" />
        <StatCard label="Active projects"     value={activeApplications}        icon={CheckCircleIcon} color="emerald" />
        <StatCard label="Last login"          value={formatDate(user.lastLoginAt)} icon={ClockIcon}   color="gray" />
        <StatCard
          label="Account status"
          value={user.isActive ? "Active" : "Suspended"}
          icon={user.isActive ? CheckCircleIcon : XCircleIcon}
          color={user.isActive ? "emerald" : "gray"}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["overview", "applications", "account"] as const).map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "applications" && (
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                  {user.applications.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="p-5 space-y-5">
            {user.baseProfile?.bio && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Bio</p>
                <p className="text-sm text-gray-700 leading-relaxed">{user.baseProfile.bio}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact & location</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: EnvelopeIcon, label: "Email",   value: user.email },
                  { icon: PhoneIcon,    label: "Phone",   value: user.baseProfile?.phone },
                  { icon: MapPinIcon,   label: "City",    value: user.baseProfile?.city },
                  { icon: MapPinIcon,   label: "Country", value: user.baseProfile?.country },
                ].map(({ icon: Icon, label, value }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm text-gray-800 truncate">{value}</p>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            {/* Volunteer-specific info */}
            {user.volunteerProfile && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Volunteer profile</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Availability</p>
                    <p className="text-sm font-medium text-gray-800">
                      {user.volunteerProfile.isAvailable ? "Available" : "Not available"}
                    </p>
                    {user.volunteerProfile.availabilityNote && (
                      <p className="text-xs text-gray-500 mt-1">{user.volunteerProfile.availabilityNote}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">Verified volunteer</p>
                    <p className={`text-sm font-medium ${user.volunteerProfile.isVerified ? "text-emerald-700" : "text-gray-500"}`}>
                      {user.volunteerProfile.isVerified ? "Verified" : "Not verified"}
                    </p>
                  </div>
                </div>
                {user.volunteerProfile.skills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {user.volunteerProfile.skills.map(({ skill }) => (
                        <span key={skill} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {user.volunteerProfile.experience && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1">Experience</p>
                    <p className="text-sm text-gray-700">{user.volunteerProfile.experience}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Applications ── */}
        {activeTab === "applications" && (
          <div className="divide-y divide-gray-50">
            {user.applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BriefcaseIcon className="h-10 w-10 mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No applications yet</p>
              </div>
            ) : (
              user.applications.map((app) => (
                <div key={app.id} className="p-5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-gray-900">{app.charityProject.title}</p>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PROJECT_STATUS_STYLES[app.charityProject.status]}`}>
                          {app.charityProject.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5">{app.charityProject.charity.name}</p>
                      {app.message && (
                        <p className="text-xs text-gray-500 italic line-clamp-2">"{app.message}"</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {formatDate(app.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Account ── */}
        {activeTab === "account" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Email",          value: user.email },
                { label: "User ID",        value: `#${user.id}` },
                { label: "Role",           value: user.role === "VOLUNTEER" ? "Volunteer" : "User" },
                { label: "Account status", value: user.isActive ? "Active" : "Suspended" },
                { label: "Last login",     value: formatDate(user.lastLoginAt) },
                { label: "Member since",   value: formatDate(user.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}