"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  TrashIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";
import Dropdown from "@/components/charity/Dropdown";

/* ── types ──────────────────────────────────────────────────────────── */

interface Volunteer {
  user: {
    id: number;
    name: string;
    email: string;
    baseProfile: {
      avatarUrl: string | null;
      city: string | null;
      phone: string | null;
      country: string | null;
    } | null;
    volunteerProfile: {
      isVerified: boolean;
      isAvailable: boolean;
      experience: string | null;
    } | null;
  };
  opportunities: {
    applicationId: number;
    opportunityId: number;
    title: string;
    startDate: string;
    endDate: string;
  }[];
}

interface Opportunity {
  id: number;
  title: string;
}

/* ── skeleton ────────────────────────────────────────────────────────── */

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

/* ── avatar ──────────────────────────────────────────────────────────── */

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={getAvatarUrl(avatarUrl)!}
        alt={name}
        className="h-9 w-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center text-[11px] font-bold text-emerald-600 shrink-0">
      {initials}
    </div>
  );
}

/* ── component ─────────────────────────────────────────────────────── */

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [oppFilter, setOppFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  // remove modal
  const [removeTarget, setRemoveTarget] = useState<Volunteer | null>(null);
  const [removeOppId, setRemoveOppId] = useState<string>("");
  const [removing, setRemoving] = useState(false);

  // email modal
  const [emailTarget, setEmailTarget] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // fetch opportunities once
  useEffect(() => {
    charityApi.get("/api/charity/opportunities").then((res) => {
      setOpportunities(
        res.data?.data?.opportunities || [],
      );
    });
  }, []);

  const fetchVolunteers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (oppFilter !== "ALL") params.set("opportunityId", oppFilter);

    charityApi
      .get(`/api/charity/volunteers?${params}`)
      .then((res) => {
        setVolunteers(res.data?.data?.volunteers || []);
        setTotal(res.data?.data?.total ?? 0);
      })
      .catch(() => setVolunteers([]))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, oppFilter]);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  /* ── actions ─────────────────────────────────────────────────────── */

const handleRemove = async () => {
  if (!removeTarget || !removeOppId) return;
  setRemoving(true);
  try {
    await charityApi.delete(`/api/charity/volunteers/${removeTarget.user.id}`, {
      data: { opportunityId: Number(removeOppId) },
    });
    setRemoveTarget(null);
    setRemoveOppId("");
    fetchVolunteers();
  } catch (err) {
    console.error("Remove error:", err);
  } finally {
    setRemoving(false);
  }
};

  const handleSendEmail = async () => {
    if (!emailTarget || !emailSubject.trim() || !emailBody.trim()) return;
    setSending(true);
    try {
      await charityApi.post(`/api/charity/volunteers/${emailTarget.id}/email`, {
        subject: emailSubject,
        body: emailBody,
      });
      setEmailSuccess(true);
    } finally {
      setSending(false);
    }
  };

  const openEmail = (v: Volunteer) => {
    setEmailTarget(v);
    setEmailSubject("");
    setEmailBody("");
    setEmailSuccess(false);
  };

  const totalPages = Math.ceil(total / LIMIT);

  /* ── render ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Volunteers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage approved volunteers across your opportunities.
          </p>
        </div>
        {!loading && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {total} volunteer{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 w-52"
          />
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <Dropdown
          value={oppFilter}
          onChange={(v) => {
            setOppFilter(v);
            setPage(1);
          }}
          options={[
            { value: "ALL", label: "All Opportunities" },
            ...opportunities.map((o) => ({
              value: String(o.id),
              label: o.title,
            })),
          ]}
          triggerClassName="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1.5 hover:border-gray-300 cursor-pointer"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["VOLUNTEER", "CONTACT", "OPPORTUNITY", "EXPERIENCE", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-3"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3.5 flex items-center gap-2.5">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Skeleton className="h-3.5 w-24" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Skeleton className="h-3.5 w-10" />
                  </td>
                  <td className="px-5 py-3.5">
                    <Skeleton className="h-7 w-20" />
                  </td>
                </tr>
              ))
            ) : volunteers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-14 text-center text-sm text-gray-400"
                >
                  No volunteers found.
                </td>
              </tr>
            ) : (
              volunteers.map((v) => (
  <tr key={v.user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
    {/* Volunteer */}
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <Avatar name={v.user.name} avatarUrl={v.user.baseProfile?.avatarUrl} />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-gray-900">{v.user.name}</p>
            {v.user.volunteerProfile?.isVerified && (
              <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" title="Verified" />
            )}
          </div>
          <p className="text-xs text-gray-400">{v.user.email}</p>
        </div>
      </div>
    </td>

    {/* Contact */}
    <td className="px-5 py-3.5">
      <div className="space-y-0.5">
        {v.user.baseProfile?.city && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <MapPinIcon className="h-3 w-3 text-gray-400" />
            {v.user.baseProfile.city}
          </p>
        )}
        {v.user.baseProfile?.phone && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <PhoneIcon className="h-3 w-3 text-gray-400" />
            {v.user.baseProfile.phone}
          </p>
        )}
        {!v.user.baseProfile?.city && !v.user.baseProfile?.phone && (
          <span className="text-xs text-gray-300">—</span>
        )}
      </div>
    </td>

    {/* Opportunities */}
    <td className="px-5 py-3.5">
      <div className="flex flex-wrap gap-1">
        {v.opportunities.slice(0, 2).map((o) => (
          <span key={o.opportunityId} className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
            {o.title}
          </span>
        ))}
        {v.opportunities.length > 2 && (
          <span className="text-[11px] text-gray-400 px-1 py-0.5">
            +{v.opportunities.length - 2}
          </span>
        )}
      </div>
    </td>

    {/* Experience */}
    <td className="px-5 py-3.5">
      {v.user.volunteerProfile?.experience ? (
        <p className="text-xs text-gray-500 max-w-[180px] truncate" title={v.user.volunteerProfile.experience}>
          {v.user.volunteerProfile.experience}
        </p>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      )}
    </td>

    {/* Actions */}
    <td className="px-5 py-3.5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openEmail({ id: v.user.id, name: v.user.name, email: v.user.email })}
          title="Send email"
          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
        >
          <EnvelopeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setRemoveTarget(v); setRemoveOppId(""); }}
          title="Remove from opportunity"
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Remove modal ─────────────────────────────────────────────── */}
      {removeTarget && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 className="text-base font-bold text-gray-900">Remove Volunteer</h2>
      <p className="text-sm text-gray-500">
        Remove <span className="font-medium text-gray-800">{removeTarget.user.name}</span> from an opportunity.
      </p>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Select opportunity</label>
        <select
          value={removeOppId}
          onChange={(e) => setRemoveOppId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-red-300 focus:ring-2 focus:ring-red-100 outline-none"
        >
          <option value="">Choose…</option>
          {removeTarget.opportunities.map((o) => (
            <option key={o.opportunityId} value={String(o.opportunityId)}>{o.title}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={() => { setRemoveTarget(null); setRemoveOppId(""); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
          Cancel
        </button>
        <button onClick={handleRemove} disabled={!removeOppId || removing} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 cursor-pointer transition-colors">
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── Email modal ──────────────────────────────────────────────── */}
      {emailTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            {emailSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                  <EnvelopeIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Email sent!
                </p>
                <p className="text-xs text-gray-400">
                  Your message was delivered to {emailTarget.name}.
                </p>
                <button
                  onClick={() => setEmailTarget(null)}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Email Volunteer
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    To: {emailTarget.name} &lt;{emailTarget.email}&gt;
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Message
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={5}
                      placeholder="Write your message…"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEmailTarget(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={
                      !emailSubject.trim() || !emailBody.trim() || sending
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
