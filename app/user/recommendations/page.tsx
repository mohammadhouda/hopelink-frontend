"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SparklesIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxSlots: number;
  score: number;
  charity: { id: number; name: string; logoUrl?: string; category?: string };
  _count: { applications: number };
}

interface Meta {
  skills: string[];
  availabilityDays: string[];
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

const CATEGORY_LABEL: Record<string, string> = {
  EDUCATION: "Education", HEALTH: "Health", ENVIRONMENT: "Environment",
  ANIMAL_WELFARE: "Animal Welfare", SOCIAL: "Social", OTHER: "Other",
};

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.min(100, score * 10);
  const color = score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-gray-500">{score > 0 ? `${score} pts` : "New"}</span>
    </div>
  );
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.get("/api/user/recommendations?limit=12")
      .then((res) => {
        setRecommendations(res.data?.data?.recommendations || []);
        setMeta(res.data?.data?.meta || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasProfile = (meta?.skills.length ?? 0) > 0 || (meta?.availabilityDays.length ?? 0) > 0;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :root {
          --font-heading: 'Inter', sans-serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>
      <div className="space-y-6 max-w-4xl" style={{ fontFamily: "var(--font-body)" }}>
        {/* Header */}
        <header style={{ animation: "fadeUp 0.35s ease both" }}>
          <div className="flex items-center gap-2.5 mb-1">
            <SparklesIcon className="h-5 w-5 text-violet-500" />
            <h1
              style={{
                fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.03em",
              }}
            >
              Recommended for You
            </h1>
          </div>
          <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: 0 }}>
            Opportunities matched to your skills and availability.
          </p>
        </header>

      {/* Profile hint */}
      {!loading && !hasProfile && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <SparklesIcon className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Improve your matches</p>
            <p className="text-xs text-amber-600 mt-0.5">Add skills and availability days to your profile to get better recommendations.</p>
          </div>
          <button
            onClick={() => router.push("/user/profile")}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0 cursor-pointer"
          >
            Update profile →
          </button>
        </div>
      )}

      {/* Match context chips */}
      {!loading && hasProfile && (
        <div className="flex flex-wrap gap-2">
          {meta!.skills.map((s) => (
            <span key={s} className="px-2.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
              {s}
            </span>
          ))}
          {meta!.availabilityDays.map((d) => (
            <span key={d} className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              {DAY_SHORT[d]}
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-20 text-center">
          <SparklesIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No open opportunities right now</p>
          <p className="text-xs text-gray-400 mt-1">Check back soon or browse all opportunities.</p>
          <button
            onClick={() => router.push("/user/opportunities")}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer transition-colors"
          >
            Browse All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              onClick={() => router.push(`/user/opportunities/${rec.id}`)}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors leading-tight line-clamp-2">
                    {rec.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <BuildingOffice2Icon className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{rec.charity.name}</span>
                    {rec.charity.category && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">
                        {CATEGORY_LABEL[rec.charity.category] ?? rec.charity.category}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0 mt-0.5" />
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{rec.description}</p>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(rec.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                {rec.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5 text-gray-400" />
                    {rec.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="h-3.5 w-3.5 text-gray-400" />
                  {rec._count.applications}/{rec.maxSlots} applied
                </span>
              </div>

              {/* Score bar */}
              <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Match score</span>
                <ScoreBadge score={rec.score} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
