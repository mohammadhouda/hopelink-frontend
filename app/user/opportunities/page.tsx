"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UsersIcon,
  FunnelIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import CustomDropdown from "@/components/CustomDropdown";

interface Opportunity {
  id: number;
  title: string;
  description?: string;
  status: string;
  maxSlots: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  requiredSkills: string[];
  availabilityDays: string[];
  myApplicationStatus?: string | null;
  matchScore?: number | null;
  charity: { id: number; name: string; logoUrl?: string; category?: string; isVerified?: boolean };
  _count?: { applications: number };
}

const STATUS_STYLE: Record<string, string> = {
  OPEN:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  FULL:      "bg-blue-50 text-blue-700 border-blue-200",
  ENDED:     "bg-gray-100 text-gray-600 border-gray-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const APP_STYLE: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border-red-200",
};

const CATEGORIES = ["EDUCATION", "HEALTH", "ENVIRONMENT", "ANIMAL_WELFARE", "SOCIAL", "OTHER"];

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const fetch = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    userApi.get(`/api/user/opportunities?${params}`)
      .then((res) => {
        setOpportunities(res.data?.data?.opportunities || []);
        setTotal(res.data?.data?.total || 0);
        setHasProfile(res.data?.data?.hasProfile || false);
      })
      .finally(() => setLoading(false));
  }, [search, category, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Browse Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">Find volunteering opportunities that match your passion.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, location..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
          <CustomDropdown
            options={CATEGORIES.map((cat) => ({ value: cat, label: cat.replace("_", " ") }))}
            value={category}
            onChange={(val) => { setCategory(val); setPage(1); }}
          />
        </div>
      </div>

      {/* Results count + sort note */}
      {!loading && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-400">
            {total} {total === 1 ? "opportunity" : "opportunities"} found
          </p>
          {hasProfile && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-violet-600">
              <SparklesIcon className="h-3 w-3" /> Sorted by match
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)
          : opportunities.length === 0
          ? (
            <div className="col-span-full py-20 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No opportunities found</p>
              <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
            </div>
          )
          : opportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => router.push(`/user/opportunities/${opp.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group flex flex-col gap-3"
            >
              {/* Charity + status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <BuildingOffice2Icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate flex items-center gap-1">
                      {opp.charity.name}
                      {opp.charity.isVerified && <CheckBadgeIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                    </p>
                    {opp.charity.category && (
                      <p className="text-[10px] text-gray-400">{opp.charity.category.replace("_", " ")}</p>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${STATUS_STYLE[opp.status] || STATUS_STYLE.OPEN}`}>
                  {opp.status}
                </span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors line-clamp-2 leading-snug">
                  {opp.title}
                </h3>
                {opp.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{opp.description}</p>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-auto">
                {opp.location && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <MapPinIcon className="h-3 w-3" /> {opp.location}
                  </span>
                )}
                {opp.startDate && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <CalendarDaysIcon className="h-3 w-3" /> {formatDate(opp.startDate)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <UsersIcon className="h-3 w-3" /> {opp._count?.applications ?? 0}/{opp.maxSlots} slots
                </span>
              </div>

              {/* Required skills */}
              {opp.requiredSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {opp.requiredSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 text-[10px] font-medium bg-violet-50 text-violet-600 border border-violet-100 rounded-full">
                      {skill}
                    </span>
                  ))}
                  {opp.requiredSkills.length > 3 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-200 rounded-full">
                      +{opp.requiredSkills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Applied badge + match score */}
              <div className="flex items-center justify-between gap-2">
                {opp.myApplicationStatus ? (
                  <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${APP_STYLE[opp.myApplicationStatus]}`}>
                    Applied — {opp.myApplicationStatus}
                  </div>
                ) : <div />}
                {hasProfile && opp.matchScore != null && opp.matchScore > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600">
                    <SparklesIcon className="h-3 w-3" />{opp.matchScore} pts
                  </span>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
