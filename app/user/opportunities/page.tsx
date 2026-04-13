"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import userApi from "@/lib/userAxios";
import CustomDropdown from "@/components/CustomDropdown";
import { getAvatarUrl } from "@/lib/avatarUrl";

/* ━━━ Types ━━━ */
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
  charity: {
    id: number;
    name: string;
    logoUrl?: string;
    category?: string;
    isVerified?: boolean;
  };
  _count?: { applications: number };
}

/* ━━━ Constants ━━━ */
const STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  OPEN:      { label: "Open",      dot: "#10B981", bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  FULL:      { label: "Full",      dot: "#3B82F6", bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  ENDED:     { label: "Ended",     dot: "#9CA3AF", bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
  CANCELLED: { label: "Cancelled", dot: "#EF4444", bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
};

const APP_CFG: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  PENDING:  { label: "Pending Review", icon: "", bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  APPROVED: { label: "Approved",       icon: "✓",  bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  DECLINED: { label: "Not Selected",   icon: "✗",  bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
};

const CATEGORIES = ["EDUCATION", "HEALTH", "ENVIRONMENT", "ANIMAL_WELFARE", "SOCIAL", "OTHER"];

const DAY_ALL = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mo", TUESDAY: "Tu", WEDNESDAY: "We",
  THURSDAY: "Th", FRIDAY: "Fr", SATURDAY: "Sa", SUNDAY: "Su",
};

/* ━━━ Helpers ━━━ */
function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function accentForStatus(status: string) {
  switch (status) {
    case "OPEN":      return "linear-gradient(90deg, #059669, #34D399)";
    case "FULL":      return "linear-gradient(90deg, #2563EB, #60A5FA)";
    case "CANCELLED": return "linear-gradient(90deg, #DC2626, #F87171)";
    default:          return "linear-gradient(90deg, #9CA3AF, #D1D5DB)";
  }
}

/* ━━━ Tiny SVG Icons (no heroicons dependency for the card) ━━━ */
const IconPin = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10.833a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 18.333S16.667 13.667 16.667 8.333a6.667 6.667 0 00-13.334 0c0 5.334 6.667 10 6.667 10z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const IconCal = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="4.167" width="15" height="13.333" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2.5 8.333h15M6.667 2.5v3.333M13.333 2.5v3.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5h15M5 10h10M7.5 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconSparkle = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" fill="currentColor" />
  </svg>
);
const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6.667V10l2.5 1.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconEmpty = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="40" height="32" rx="4" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="4 3" />
    <circle cx="28" cy="28" r="8" stroke="#E5E7EB" strokeWidth="2" />
    <path d="M25 28h6M28 25v6" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ━━━ Match Badge ━━━ */
const MATCH_LEVELS: { min: number; label: string; bg: string; text: string; border: string; icon: string }[] = [
  { min: 12, label: "Best Match",  bg: "#ECFDF5", text: "#059669", border: "#A7F3D0", icon: "✦" },
  { min: 5, label: "Good Match",  bg: "#EEF2FF", text: "#6366F1", border: "#C7D2FE", icon: "✦" },
  { min: 2,  label: "Some Match",  bg: "#F9FAFB", text: "#9CA3AF", border: "#E5E7EB", icon: "✦" },
];

function MatchBadge({ score }: { score: number }) {
  const level = MATCH_LEVELS.find((l) => score >= l.min) || MATCH_LEVELS[2];

  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 20,
        background: level.bg,
        border: `1px solid ${level.border}`,
        fontSize: 10.5, fontWeight: 700,
        color: level.text,
        fontFamily: "var(--font-body)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9 }}>{level.icon}</span>
      {level.label}
    </span>
  );
}

/* ━━━ Skeleton ━━━ */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className ?? ""}`}
      style={{
        background: "linear-gradient(110deg, #F3F4F6 30%, #FAFAFA 50%, #F3F4F6 70%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease infinite",
      }}
    />
  );
}

/* ━━━ Opportunity Card ━━━ */
function OpportunityCard({ opp, index, onClick }: { opp: Opportunity; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const status = STATUS_CFG[opp.status] || STATUS_CFG.OPEN;
  const appStatus = opp.myApplicationStatus ? APP_CFG[opp.myApplicationStatus] : null;
  const filled = opp._count?.applications ?? 0;
  const slotsLeft = opp.maxSlots - filled;
  const slotPct = Math.min((filled / opp.maxSlots) * 100, 100);

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="opp-card group"
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: `1px solid ${hovered ? "rgba(99,102,241,0.35)" : "#E8E8EC"}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
        boxShadow: hovered
          ? "0 16px 48px -12px rgba(99,102,241,0.13), 0 2px 8px rgba(0,0,0,0.03)"
          : "0 1px 4px rgba(0,0,0,0.03)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          height: 3,
          background: accentForStatus(opp.status),
          opacity: hovered ? 1 : 0.5,
          transition: "opacity 0.3s",
        }}
      />

      <div style={{ padding: "20px 22px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {/* Row 1 — Charity + Status + Match */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div
              className="shrink-0"
              style={{
                width: 38, height: 38, borderRadius: 11,
                background: "linear-gradient(135deg, #F5F3FF 0%, #EEE9FE 100%)",
                border: "1px solid #E9E5F5",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}
            >
              <img src={getAvatarUrl(opp.charity.logoUrl)} alt={opp.charity.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 11 }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span
                  className="truncate"
                  style={{
                    fontSize: 12, fontWeight: 600, color: "#6B7280",
                    fontFamily: "var(--font-body)",
                    maxWidth: 150, display: "block",
                  }}
                >
                  {opp.charity.name}
                </span>
                {opp.charity.isVerified && (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
                    <circle cx="10" cy="10" r="10" fill="#3B82F6" />
                    <path d="M6 10.5L8.5 13L14 7.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {opp.charity.category && (
                <span style={{ fontSize: 10, color: "#A1A1AA", fontFamily: "var(--font-body)", textTransform: "capitalize" }}>
                  {opp.charity.category.replace(/_/g, " ").toLowerCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Status pill */}
            <div
              className="flex items-center gap-1.5"
              style={{
                padding: "3px 10px", borderRadius: 20,
                background: status.bg,
                border: `1px solid ${status.border}`,
              }}
            >
              <span
                style={{
                  width: 6, height: 6, borderRadius: "50%", background: status.dot,
                  boxShadow: opp.status === "OPEN" ? `0 0 6px ${status.dot}` : "none",
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: status.text, fontFamily: "var(--font-body)" }}>
                {status.label}
              </span>
            </div>
            {/* Match badge */}
            {opp.matchScore != null && opp.matchScore > 0 && (
              <MatchBadge score={opp.matchScore} />
            )}
          </div>
        </div>

        {/* Row 2 — Title + Description */}
        <div>
          <h3
            style={{
              fontSize: 15, fontWeight: 700, lineHeight: 1.45, margin: 0,
              color: hovered ? "#4F46E5" : "#111827",
              fontFamily: "var(--font-heading)",
              transition: "color 0.25s",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}
          >
            {opp.title}
          </h3>
          {opp.description && (
            <p
              style={{
                fontSize: 12.5, lineHeight: 1.6, color: "#9CA3AF", margin: "5px 0 0",
                fontFamily: "var(--font-body)",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}
            >
              {opp.description}
            </p>
          )}
        </div>

        {/* Row 3 — Meta chips */}
        <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ color: "#7C7C8A" }}>
          {opp.location && (
            <span className="flex items-center gap-1" style={{ fontSize: 11.5, fontFamily: "var(--font-body)" }}>
              <IconPin /> {opp.location}
            </span>
          )}
          {opp.startDate && (
            <span className="flex items-center gap-1" style={{ fontSize: 11.5, fontFamily: "var(--font-body)" }}>
              <IconCal /> {formatDate(opp.startDate)}
            </span>
          )}
        </div>

        {/* Row 4 — Slot progress bar */}
        <div className="flex items-center gap-2.5">
          <div style={{ flex: 1, height: 5, borderRadius: 999, background: "#F3F4F6", overflow: "hidden" }}>
            <div
              style={{
                height: "100%", borderRadius: 999,
                width: `${slotPct}%`,
                background: slotPct >= 90
                  ? "linear-gradient(90deg, #EF4444, #F87171)"
                  : "linear-gradient(90deg, #6366F1, #A5B4FC)",
                transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              color: slotsLeft <= 2 ? "#DC2626" : "#6B7280",
              fontFamily: "var(--font-mono)",
              minWidth: 38, textAlign: "right",
            }}
          >
            {slotsLeft <= 0 ? "Full" : `${slotsLeft} left`}
          </span>
        </div>

        {/* Row 5 — Skills */}
        {opp.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {opp.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                style={{
                  padding: "3px 10px", borderRadius: 999,
                  fontSize: 10.5, fontWeight: 600,
                  background: "#F0EDFF", color: "#5B50D6",
                  border: "1px solid #E4DFFC",
                  fontFamily: "var(--font-body)",
                }}
              >
                {skill}
              </span>
            ))}
            {opp.requiredSkills.length > 4 && (
              <span
                style={{
                  padding: "3px 10px", borderRadius: 999,
                  fontSize: 10.5, fontWeight: 600,
                  background: "#F9FAFB", color: "#9CA3AF",
                  border: "1px solid #E5E7EB",
                  fontFamily: "var(--font-mono)",
                }}
              >
                +{opp.requiredSkills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Row 6 — Availability days (mini week grid) */}
        {opp.availabilityDays?.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span style={{ color: "#A1A1AA" }}><IconClock /></span>
            <div className="flex gap-1">
              {DAY_ALL.map((d) => {
                const active = opp.availabilityDays.includes(d);
                return (
                  <span
                    key={d}
                    style={{
                      width: 26, height: 22, borderRadius: 6,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9.5, fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: active ? "#6366F1" : "#F9FAFB",
                      color: active ? "#FFF" : "#D1D5DB",
                      border: `1px solid ${active ? "#6366F1" : "#E5E7EB"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {DAY_SHORT[d]}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 7 — Applied badge */}
        {appStatus && (
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 10,
              background: appStatus.bg, border: `1px solid ${appStatus.border}`,
              fontSize: 11.5, fontWeight: 700, color: appStatus.text,
              fontFamily: "var(--font-body)",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 13 }}>{appStatus.icon}</span>
            {appStatus.label}
          </div>
        )}
      </div>
    </article>
  );
}

/* ━━━ Page ━━━ */
export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [hasScores, setHasScores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;
  const inputRef = useRef<HTMLInputElement>(null);

  function loadOpportunities() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    userApi
      .get(`/api/user/opportunities?${params}`)
      .then((res) => {
        setOpportunities(res.data?.data?.opportunities || []);
        setTotal(res.data?.data?.total || 0);
        setHasScores(res.data?.data?.hasScores || false);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOpportunities();
  }, [search, category, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {/* Inject CSS variables + fonts + animations */}
      <style>{`
        :root {
          --font-heading: 'General Sans', 'DM Sans', system-ui, sans-serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
          --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
          --page-bg: #FAFAFB;
          --accent: #6366F1;
          --accent-light: #EEF2FF;
        }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .opp-card {
          animation: fadeUp 0.4s ease both;
        }
        .search-input:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .pagination-btn {
          padding: 7px 16px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
          background: #FFF;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
        }
        .pagination-btn:hover:not(:disabled) {
          background: var(--accent-light);
          border-color: var(--accent);
          color: var(--accent);
        }
        .pagination-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .search-btn {
          padding: 0 20px;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: var(--accent);
          color: #FFF;
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-body);
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          flex-shrink: 0;
        }
        .search-btn:hover {
          background: #4F46E5;
          transform: translateY(-1px);
        }
        .search-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="space-y-6 max-w-[1140px]" style={{ fontFamily: "var(--font-body)" }}>
        {/* ── Header ── */}
        <header style={{ animation: "fadeUp 0.35s ease both" }}>
          <h1
            style={{
              fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.03em",
            }}
          >
            Browse Opportunities
          </h1>
          <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: "4px 0 0" }}>
            Find volunteering opportunities that match your passion.
          </p>
        </header>

        {/* ── Search + Filters ── */}
        <div
          className="flex flex-col sm:flex-row gap-3"
          style={{ animation: "fadeUp 0.4s ease 0.05s both" }}
        >
          <form onSubmit={handleSearch} className="flex-1 flex gap-2.5">
            <div className="relative flex-1">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "#9CA3AF", display: "flex" }}
              >
                <IconSearch />
              </span>
              <input
                ref={inputRef}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, location…"
                className="search-input"
                style={{
                  width: "100%",
                  height: 44,
                  paddingLeft: 38, paddingRight: 16,
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  background: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  outline: "none",
                  color: "#111827",
                  transition: "all 0.25s",
                }}
              />
            </div>
            <button type="submit" className="search-btn">Search</button>
          </form>

          <div className="flex items-center gap-2">
            <span style={{ color: "#9CA3AF", display: "flex" }}><IconFilter /></span>
            <CustomDropdown
              options={CATEGORIES.map((cat) => ({ value: cat, label: cat.replace(/_/g, " ") }))}
              value={category}
              onChange={(val: string) => { setCategory(val); setPage(1); }}
            />
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <div
            className="flex items-center gap-2.5"
            style={{ animation: "fadeUp 0.4s ease 0.1s both" }}
          >
            <p style={{ fontSize: 12, color: "#A1A1AA", fontFamily: "var(--font-body)", margin: 0 }}>
              <span style={{ fontWeight: 700, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{total}</span>
              {" "}{total === 1 ? "opportunity" : "opportunities"} found
            </p>
            {hasScores && (
              <span
                className="flex items-center gap-1"
                style={{
                  fontSize: 11, fontWeight: 600, color: "var(--accent)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <IconSparkle /> Sorted by match
              </span>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-56" />
            ))
          ) : opportunities.length === 0 ? (
            <div
              className="col-span-full flex flex-col items-center justify-center py-24"
              style={{ animation: "fadeUp 0.5s ease both" }}
            >
              <IconEmpty />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#9CA3AF", margin: "16px 0 0", fontFamily: "var(--font-body)" }}>
                No opportunities found
              </p>
              <p style={{ fontSize: 12, color: "#D1D5DB", margin: "4px 0 0", fontFamily: "var(--font-body)" }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            opportunities.map((opp, i) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                index={i}
                onClick={() => router.push(`/user/opportunities/${opp.id}`)}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav
            className="flex items-center justify-center gap-3 pt-2"
            style={{ animation: "fadeUp 0.4s ease 0.15s both" }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", fontFamily: "var(--font-mono)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </nav>
        )}
      </div>
    </>
  );
}