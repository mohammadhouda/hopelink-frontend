"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon, XCircleIcon, ClockIcon, FunnelIcon,
  XMarkIcon, BriefcaseIcon, MapPinIcon, PhoneIcon, EnvelopeIcon,
  CheckBadgeIcon, CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";
import Dropdown from "@/components/charity/Dropdown";
import CustomDatePicker from "@/components/CustomDatePicker";

interface Application {
  id: number;
  message: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  userId: number;
  opportunityId: number;
  createdAt: string;
  updatedAt: string;
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

interface Opportunity {
  id: number;
  title: string;
}

interface ApplicantProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  applicationMessage?: string | null;
  applicationStatus: string;
  appliedAt: string;
  baseProfile: { avatarUrl?: string | null; phone?: string | null; city?: string | null; country?: string | null; bio?: string | null } | null;
  volunteerProfile: {
    isVerified: boolean;
    isAvailable: boolean;
    availabilityDays: string[];
    experience?: string | null;
    skills: { skill: string }[];
    experiences: { id: number; company: string; role: string; startDate: string; endDate?: string | null; isCurrent: boolean; description?: string | null }[];
  } | null;
}

const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

function fmtMonth(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border-red-200",
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [oppFilter, setOppFilter] = useState("ALL");
  const [createdAt, setCreatedAt] = useState("");
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile | null>(null);
  const [loadingApplicant, setLoadingApplicant] = useState(false);

const fetchData = () => {
  setLoading(true);
  const params = new URLSearchParams();
  if (statusFilter !== "ALL") params.set("status", statusFilter);
  if (oppFilter !== "ALL") params.set("opportunityId", oppFilter);
  if (createdAt) {
    params.set("from", createdAt);
    params.set("to", createdAt);
  }

  charityApi.get(`/api/charity/applications?${params}`)
    .then((res) => {
      setApplications(res.data?.data?.applications || []);
    })
    .catch((err) => {
      console.error("Fetch error:", err);
    })
    .finally(() => setLoading(false));
};

  useEffect(() => {
  charityApi.get("/api/charity/opportunities")
    .then((res) => {
      setOpportunities(res.data?.data?.opportunities || res.data?.data?.recentOpportunities || []);
    });
  }, []);

  useEffect(() => { fetchData(); }, [statusFilter, oppFilter, createdAt]);

  const openApplicant = async (applicationId: number) => {
    setLoadingApplicant(true);
    setApplicantProfile(null);
    try {
      const res = await charityApi.get(`/api/charity/applications/${applicationId}/applicant`);
      setApplicantProfile(res.data?.data);
    } finally {
      setLoadingApplicant(false);
    }
  };

  const handleApprove = async (id: number) => {
    await charityApi.patch(`/api/charity/applications/${id}/approve`);
    fetchData();
  };

  const handleDecline = async () => {
    if (!declineId) return;
    await charityApi.patch(`/api/charity/applications/${declineId}/decline`, { reason: declineReason });
    setDeclineId(null);
    setDeclineReason("");
    fetchData();
  };

  const pending = applications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage volunteer applications.</p>
        </div>
        {pending > 0 && (
          <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            {pending} pending
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1">
          {(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((s) => (
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
        <Dropdown
          value={oppFilter}
          onChange={setOppFilter}
          options={[
            { value: "ALL", label: "All Opportunities" },
            ...opportunities.map((o) => ({ value: String(o.id), label: o.title })),
          ]}
          triggerClassName="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-300 cursor-pointer"
        />
        <div className="h-5 w-px bg-gray-200" />
        <CustomDatePicker value={createdAt} onChange={setCreatedAt} placeholder="Date Added" className="w-36" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["VOLUNTEER", "OPPORTUNITY", "STATUS", "APPLIED", ""].map((h) => (
                <th key={h || "a"} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40 mt-1" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-7 w-28" /></td>
                </tr>
              ))
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-sm text-gray-400">
                  No applications found.
                </td>
              </tr>
            ) : (
              applications.map((a) => (
  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
    <td className="px-5 py-3.5">
      <button onClick={() => openApplicant(a.id)} className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity cursor-pointer">
        {a.user.baseProfile?.avatarUrl ? (
          <img src={getAvatarUrl(a.user.baseProfile.avatarUrl)!} alt={a.user.name} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-[11px] font-bold text-emerald-600">
            {a.user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900 hover:text-emerald-600 transition-colors">{a.user.name}</p>
          <p className="text-xs text-gray-400">{a.user.email}</p>
        </div>
      </button>
    </td>
    <td className="px-5 py-3.5">
      <button
        onClick={() => router.push(`/charity/opportunities/${a.opportunity.id}`)}
        className="text-sm text-gray-700 hover:text-emerald-600 transition-colors cursor-pointer text-left"
      >
        {a.opportunity.title}
      </button>
    </td>
    <td className="px-5 py-3.5">
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[a.status]}`}>
        {a.status === "APPROVED" ? <CheckCircleIcon className="h-3 w-3" /> : a.status === "DECLINED" ? <XCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
        {a.status}
      </span>
    </td>
    <td className="px-5 py-3.5 text-sm text-gray-500">
      {new Date(a.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
    </td>
    <td className="px-5 py-3.5">
      {a.status === "PENDING" && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => handleApprove(a.id)} className="px-3 py-1 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer">
            Approve
          </button>
          <button onClick={() => setDeclineId(a.id)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer">
            Decline
          </button>
        </div>
      )}
    </td>
  </tr>
))
            )}
          </tbody>
        </table>
      </div>

      {/* Applicant profile drawer */}
      {(applicantProfile || loadingApplicant) && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" onClick={() => setApplicantProfile(null)} />
          {/* Panel */}
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Applicant Profile</h2>
              <button onClick={() => setApplicantProfile(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {loadingApplicant ? (
              <div className="flex-1 flex items-center justify-center p-10">
                <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-emerald-500 animate-spin" />
              </div>
            ) : applicantProfile && (
              <div className="p-6 space-y-6">
                {/* Identity */}
                <div className="flex items-start gap-4">
                  {applicantProfile.baseProfile?.avatarUrl ? (
                    <img src={getAvatarUrl(applicantProfile.baseProfile.avatarUrl)!} alt={applicantProfile.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-700 shrink-0">
                      {applicantProfile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-900">{applicantProfile.name}</h3>
                      {applicantProfile.volunteerProfile?.isVerified && (
                        <CheckBadgeIcon className="h-4 w-4 text-blue-500 shrink-0" title="Verified volunteer" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {applicantProfile.baseProfile?.city && (
                        <span className="flex items-center gap-1 text-xs text-gray-500"><MapPinIcon className="h-3 w-3" />{applicantProfile.baseProfile.city}{applicantProfile.baseProfile.country ? `, ${applicantProfile.baseProfile.country}` : ""}</span>
                      )}
                      {applicantProfile.baseProfile?.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500"><PhoneIcon className="h-3 w-3" />{applicantProfile.baseProfile.phone}</span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-500"><EnvelopeIcon className="h-3 w-3" />{applicantProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${STATUS_STYLE[applicantProfile.applicationStatus]}`}>
                        {applicantProfile.applicationStatus}
                      </span>
                      <span className="text-xs text-gray-400">Applied {new Date(applicantProfile.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {applicantProfile.baseProfile?.bio && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">About</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{applicantProfile.baseProfile.bio}</p>
                  </div>
                )}

                {/* Application message */}
                {applicantProfile.applicationMessage && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Application Message</p>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 italic">"{applicantProfile.applicationMessage}"</p>
                  </div>
                )}

                {/* Skills */}
                {(applicantProfile.volunteerProfile?.skills?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {applicantProfile.volunteerProfile!.skills.map((s) => (
                        <span key={s.skill} className="px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">{s.skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability days */}
                {(applicantProfile.volunteerProfile?.availabilityDays?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Availability</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400" />
                      {applicantProfile.volunteerProfile!.availabilityDays.map((d) => (
                        <span key={d} className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">{DAY_SHORT[d] ?? d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience history */}
                {(applicantProfile.volunteerProfile?.experiences?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Experience</p>
                    <div className="space-y-4">
                      {applicantProfile.volunteerProfile!.experiences.map((exp) => (
                        <div key={exp.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                            <BriefcaseIcon className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                            <p className="text-xs text-gray-500">{exp.company}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {fmtMonth(exp.startDate)} — {exp.isCurrent ? "Present" : fmtMonth(exp.endDate)}
                            </p>
                            {exp.description && (
                              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy experience note */}
                {applicantProfile.volunteerProfile?.experience && (applicantProfile.volunteerProfile.experiences?.length ?? 0) === 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Background</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{applicantProfile.volunteerProfile.experience}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decline modal */}
      {declineId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Decline Application</h2>
            <p className="text-sm text-gray-500">Optionally provide a reason for declining.</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none resize-none"
              placeholder="Reason (optional)"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setDeclineId(null); setDeclineReason(""); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDecline} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl cursor-pointer">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
