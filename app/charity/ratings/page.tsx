"use client";
import { useState, useEffect } from "react";
import { StarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import charityApi from "@/lib/charityAxios";
import Dropdown, { DropdownOption } from "@/components/charity/Dropdown";

interface Rating {
  id: number;
  rating: number;  
  comment?: string;
  createdAt: string;
  volunteer: {
    id: number;
    name: string;
    email: string;
  };
  opportunity: {
    id: number;
    title: string;
  };
}

interface EndedOpportunity {
  id: number;
  title: string;
}

interface ApprovedVolunteer {
  applicationId: number;
  volunteerId: number;
  volunteerName: string;
  volunteerEmail: string;
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

function StarRating({ score, onRate }: { score: number; onRate?: (s: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = (hovered || score) >= s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onRate?.(s)}
            onMouseEnter={() => onRate && setHovered(s)}
            onMouseLeave={() => onRate && setHovered(0)}
            className={onRate ? "cursor-pointer" : "cursor-default"}
          >
            {filled ? (
              <StarIconSolid className="h-5 w-5 text-amber-400" />
            ) : (
              <StarIcon className="h-5 w-5 text-gray-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [opportunities, setOpportunities] = useState<EndedOpportunity[]>([]);
  const [volunteers, setVolunteers] = useState<ApprovedVolunteer[]>([]);

  const oppOptions: DropdownOption[] = [
    { value: "", label: "Select opportunity..." },
    ...opportunities.map((o) => ({ value: String(o.id), label: o.title })),
  ];
  const volOptions: DropdownOption[] = [
    { value: "", label: "Select volunteer..." },
    ...volunteers.map((v) => ({ value: String(v.applicationId), label: v.volunteerName })),
  ];
  const [selectedOpp, setSelectedOpp] = useState("");
  const [selectedVol, setSelectedVol] = useState("");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingVols, setLoadingVols] = useState(false);

const fetchRatings = () => {
  charityApi.get("/api/charity/ratings")
    .then((res) => setRatings(res.data?.data?.ratings || []))
    .finally(() => setLoading(false));
};

  useEffect(() => { fetchRatings(); }, []);

  const openForm = async () => {
    const res = await charityApi.get("/api/charity/opportunities?status=ENDED");
    setOpportunities(res.data?.data?.opportunities || res.data?.data?.recentOpportunities || []);
    setSelectedOpp("");
    setSelectedVol("");
    setScore(5);
    setComment("");
    setShowForm(true);
  };

const onOppChange = async (oppId: string) => {
  setSelectedOpp(oppId);
  setSelectedVol("");
  if (!oppId) { setVolunteers([]); return; }
  setLoadingVols(true);
  const res = await charityApi.get(`/api/charity/applications?opportunityId=${oppId}&status=APPROVED`);
  const apps = res.data?.data?.applications || [];
  setVolunteers(apps.map((a: any) => ({
    applicationId: a.id,
    volunteerId: a.userId,
    volunteerName: a.user.name,
    volunteerEmail: a.user.email,
  })));
  setLoadingVols(false);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedVol || !selectedOpp) return;
  setSubmitting(true);
  try {
    const volunteer = volunteers.find((v) => String(v.applicationId) === selectedVol);
    await charityApi.post("/api/charity/ratings", {
      volunteerId: volunteer?.volunteerId,
      opportunityId: parseInt(selectedOpp),
      rating: score,
      comment: comment || undefined,
    });
    setShowForm(false);
    fetchRatings();
  } finally {
    setSubmitting(false);
  }
};

const avg = ratings.length
  ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
  : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Volunteer Ratings</h1>
          <p className="text-sm text-gray-500 mt-1">Rate volunteers after opportunities have ended.</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" /> Rate Volunteer
        </button>
      </div>

      {/* Summary */}
      {!loading && ratings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <StarIconSolid className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{avg}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <p className="text-sm text-gray-500">{ratings.length} total ratings given</p>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["VOLUNTEER", "OPPORTUNITY", "RATING", "COMMENT", "DATE"].map((h) => (
                <th key={h} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                </tr>
              ))
            ) : ratings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <StarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No ratings yet. Rate your volunteers after opportunities end.</p>
                </td>
              </tr>
            ) : (
              ratings.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{r.volunteer.name}</p>
                    <p className="text-xs text-gray-400">{r.volunteer.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{r.opportunity.title}</td>
                  <td className="px-5 py-3.5">
                    <StarRating score={r.rating} />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[220px]">
                    <p className="truncate">{r.comment || <span className="text-gray-300">—</span>}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Rating form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Rate a Volunteer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Ended Opportunity <span className="text-red-400">*</span>
                </label>
                <Dropdown
                  value={selectedOpp}
                  onChange={onOppChange}
                  options={oppOptions}
                  placeholder="Select opportunity..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Volunteer <span className="text-red-400">*</span>
                </label>
                <Dropdown
                  value={selectedVol}
                  onChange={setSelectedVol}
                  options={volOptions}
                  placeholder={loadingVols ? "Loading..." : "Select volunteer..."}
                  disabled={!selectedOpp || loadingVols}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Rating <span className="text-red-400">*</span>
                </label>
                <StarRating score={score} onRate={setScore} />
                <p className="text-xs text-gray-400 mt-1">{score} out of 5</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="modal-input resize-none"
                  placeholder="Optional feedback..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !selectedOpp || !selectedVol} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit Rating"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
