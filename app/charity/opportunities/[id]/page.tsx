"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon, UsersIcon, ChatBubbleLeftRightIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";

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

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border-red-200",
};

const OPP_STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-gray-50 text-gray-600 border-gray-200",
  ENDED: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");

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
    await charityApi.patch(`/api/charity/applications/${appId}/approve`);
    fetchData();
  };

  const handleDecline = async () => {
    if (!declineId) return;
    await charityApi.patch(`/api/charity/applications/${declineId}/decline`, { reason: declineReason });
    setDeclineId(null);
    setDeclineReason("");
    fetchData();
  };

  const filtered = statusFilter === "ALL"
    ? applications
    : applications.filter((a) => a.status === statusFilter);

  if (loading) {
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded" />
        <div className="animate-pulse h-40 w-full bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!opp) {
    return <div className="text-sm text-gray-500 p-6">Opportunity not found.</div>;
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push("/charity/opportunities")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to Opportunities
      </button>

      {/* Opportunity info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{opp.title}</h1>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${OPP_STATUS_STYLE[opp.status]}`}>
                {opp.status}
              </span>
            </div>
            {opp.description && <p className="text-sm text-gray-600 leading-relaxed">{opp.description}</p>}
          </div>
          {opp.status !== "ENDED" && (
            <button
              onClick={() => router.push(`/charity/rooms/${opp.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Chat Room
            </button>
          )}
        </div>
       <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
          <Stat label="Slots" value={opp.maxSlots} />
          <Stat
            label="Start Date"
            value={opp.startDate ? new Date(opp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
          />
          <Stat label="Location" value={opp.location || "—"} />
          <Stat label="Applications" value={applications.length} />
        </div>
      </div>

      {/* Applications */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Applications</h2>
          <div className="flex gap-1">
            {(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  statusFilter === s
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <UsersIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No applications.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["VOLUNTEER", "STATUS", "APPLIED", ""].map((h) => (
                  <th key={h || "a"} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
    <td className="px-5 py-3">
      <div className="flex items-center gap-2.5">
        {a.user.baseProfile?.avatarUrl ? (
          <img src={a.user.baseProfile.avatarUrl} alt={a.user.name} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-[11px] font-bold text-emerald-600">
            {a.user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">{a.user.name}</p>
          <p className="text-xs text-gray-400">{a.user.email}</p>
        </div>
      </div>
    </td>
    <td className="px-5 py-3">
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[a.status]}`}>
        {a.status === "APPROVED" ? <CheckCircleIcon className="h-3 w-3" /> : a.status === "DECLINED" ? <XCircleIcon className="h-3 w-3" /> : <ClockIcon className="h-3 w-3" />}
        {a.status}
      </span>
    </td>
    <td className="px-5 py-3 text-sm text-gray-500">
      {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </td>
    <td className="px-5 py-3">
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
))}
            </tbody>
          </table>
        )}
      </div>

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
              <button
                onClick={() => { setDeclineId(null); setDeclineReason(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}
