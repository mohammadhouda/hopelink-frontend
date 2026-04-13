"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UsersIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import { useVolunteer } from "@/context/VolunteerContext";
import { canApplyToOpportunity, getMissingFields } from "@/lib/profileCompleteness";
import CompleteProfileModal from "@/components/ui/CompleteProfileModal";
import { OPPORTUNITY_STATUS, APPLICATION_STATUS } from "@/lib/constants";
import { formatDate, formatDateLong } from "@/lib/dateUtils";

interface Opportunity {
  id: number;
  title: string;
  description: string;
  status: string;
  maxSlots: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  myApplication?: { id: number; status: string; createdAt: string; message?: string } | null;
  charity: { id: number; name: string; logoUrl?: string; category?: string; isVerified?: boolean; city?: string; description?: string };
  project?: { id: number; title: string } | null;
  _count?: { applications: number };
}

const STATUS_CONFIG = OPPORTUNITY_STATUS;
const APP_CONFIG_ICONS: Record<string, React.ElementType> = {
  PENDING:  ClockIcon,
  APPROVED: CheckCircleIcon,
  DECLINED: XCircleIcon,
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { volunteer, loading: volunteerLoading } = useVolunteer();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [error, setError] = useState("");
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const fetchOpp = () => {
    setLoading(true);
    userApi.get(`/api/user/opportunities/${id}`)
      .then((res) => setOpp(res.data?.data || null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOpp(); }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check profile completeness
    if (volunteer && !canApplyToOpportunity(volunteer)) {
      const missing = getMissingFields(volunteer, 'apply');
      setMissingFields(missing);
      setShowCompleteProfile(true);
      return;
    }
    
    setApplying(true);
    setError("");
    try {
      await userApi.post(`/api/user/applications/${id}`, { message });
      setShowApplyForm(false);
      fetchOpp();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  const handleApplyClick = () => {
    // Check profile completeness
    if (volunteer && !canApplyToOpportunity(volunteer)) {
      const missing = getMissingFields(volunteer, 'apply');
      setMissingFields(missing);
      setShowCompleteProfile(true);
      return;
    }
    setShowApplyForm(true);
  };

  const handleWithdraw = async () => {
    if (!opp?.myApplication) return;
    setWithdrawing(true);
    try {
      await userApi.delete(`/api/user/applications/${opp.myApplication.id}`);
      fetchOpp();
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-5">
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-200 p-7 space-y-4">
          <div className="h-7 w-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-sm bg-gray-50 rounded animate-pulse" />
          <div className="h-4 w-full max-w-xs bg-gray-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-gray-400">Opportunity not found.</p>
        <button onClick={() => router.push("/user/opportunities")} className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium cursor-pointer">
          ← Back to opportunities
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[opp.status] || STATUS_CONFIG.OPEN;
  const appStatus = opp.myApplication?.status;
  const appCfg = appStatus ? APPLICATION_STATUS[appStatus] : null;
  const AppIcon = appStatus ? APP_CONFIG_ICONS[appStatus] : null;
  const canApply = opp.status === "OPEN" && !opp.myApplication;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <button
        onClick={() => router.push("/user/opportunities")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer group"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Opportunities
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-1 bg-linear-to-r from-violet-500 to-purple-500" />
        <div className="p-6 md:p-7">
          {/* Status + category */}
          <div className="flex items-center gap-2.5 mb-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {opp.project && (
              <span className="text-[11px] text-gray-400 font-medium border border-gray-200 px-2 py-0.5 rounded-full">
                {opp.project.title}
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{opp.title}</h1>

          {/* Charity */}
          <div className="flex items-center gap-2 mt-3">
            <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{opp.charity.name}</span>
            {opp.charity.isVerified && <CheckBadgeIcon className="h-4 w-4 text-blue-500" />}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {[
              { icon: MapPinIcon,       label: "Location",    value: opp.location || "Not specified" },
              { icon: CalendarDaysIcon, label: "Start Date",  value: formatDateLong(opp.startDate) },
              { icon: CalendarDaysIcon, label: "End Date",    value: formatDateLong(opp.endDate) },
              { icon: UsersIcon,        label: "Slots",       value: `${opp._count?.applications ?? 0} / ${opp.maxSlots}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">About this Opportunity</h2>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{opp.description}</p>
      </div>

      {/* Application section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Your Application</h2>

        {opp.myApplication && appCfg && AppIcon ? (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${appCfg.badge}`}>
              <AppIcon className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{appCfg.label}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  Submitted {formatDate(opp.myApplication.createdAt)}
                </p>
              </div>
            </div>
            {opp.myApplication.message && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Your message</p>
                {opp.myApplication.message}
              </div>
            )}
            {opp.myApplication.status === "PENDING" && (
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="w-full py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
              >
                {withdrawing ? "Withdrawing..." : "Withdraw Application"}
              </button>
            )}
            {opp.myApplication.status === "APPROVED" && (
              <button
                onClick={() => router.push(`/user/rooms/${opp.id}`)}
                className="w-full py-2.5 text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl transition-all cursor-pointer"
              >
                Go to Volunteer Room
              </button>
            )}
          </div>
        ) : canApply ? (
          showApplyForm ? (
            <form onSubmit={handleApply} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Tell the charity why you'd like to volunteer..."
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl transition-all cursor-pointer disabled:opacity-60"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={handleApplyClick}
              className="w-full py-3 text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl shadow-sm shadow-violet-200 transition-all cursor-pointer"
            >
              Apply Now
            </button>
          )
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            {opp.status === "FULL" && "This opportunity is full."}
            {opp.status === "ENDED" && "This opportunity has ended."}
            {opp.status === "CANCELLED" && "This opportunity has been cancelled."}
          </p>
        )}
      </div>

      {/* Complete profile modal */}
      {showCompleteProfile && (
        <CompleteProfileModal
          onClose={() => setShowCompleteProfile(false)}
          missingFields={missingFields}
          action="apply"
          accent="violet"
        />
      )}
    </div>
  );
}
