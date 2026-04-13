"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";

/* ── types ────────────────────────────────────────────────── */
interface Room {
  id: number;
  opportunityId: number;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
  myRole: string;
  joinedAt: string;
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
    sender: { name: string };
  } | null;
  opportunity: {
    id: number;
    title: string;
    startDate?: string;
    endDate?: string;
    charity: { id: number; name: string; logoUrl?: string };
  };
  _count: { members: number; messages: number };
}

type FilterType = "all" | "active" | "closed";

/* ── helpers ──────────────────────────────────────────────── */
function formatDate(iso?: string | null) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(iso: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatDate(iso);
}

function resolveImage(url?: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : getAvatarUrl(url);
}

/* ── skeleton ─────────────────────────────────────────────── */
function RoomSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="h-12 w-12 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-64 bg-gray-50 rounded animate-pulse" />
      </div>
      <div className="h-3 w-12 bg-gray-50 rounded animate-pulse" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                */
/* ══════════════════════════════════════════════════════════ */
export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    userApi
      .get("/api/user/rooms")
      .then((res) => setRooms(res.data?.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rooms
    .filter((r) => {
      if (filter === "active") return r.status === "ACTIVE";
      if (filter === "closed") return r.status === "CLOSED";
      return true;
    })
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.opportunity.title.toLowerCase().includes(q) ||
        r.opportunity.charity.name.toLowerCase().includes(q)
      );
    });

  const activeCount = rooms.filter((r) => r.status === "ACTIVE").length;
  const closedCount = rooms.filter((r) => r.status === "CLOSED").length;
  const totalUnread = rooms.reduce((sum, r) => sum + r._count.messages, 0);

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
        <header className="flex items-start justify-between" style={{ animation: "fadeUp 0.35s ease both" }}>
          <div>
            <h1
              style={{
                fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.03em",
              }}
            >
              Messages
            </h1>
            <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: "4px 0 0" }}>
              Chat rooms from your approved volunteer opportunities.
            </p>
          </div>
          {!loading && rooms.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {activeCount} active
              </div>
              {closedCount > 0 && (
                <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {closedCount} archived
                </div>
              )}
            </div>
          )}
        </header>

      {/* Stats */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={ChatBubbleLeftRightIcon}
            label="Total Rooms"
            value={rooms.length}
            color="violet"
          />
          <StatCard
            icon={UserGroupIcon}
            label="Active Conversations"
            value={activeCount}
            color="emerald"
          />
          <StatCard
            icon={ChatBubbleOvalLeftEllipsisIcon}
            label="Total Messages"
            value={totalUnread}
            color="blue"
          />
        </div>
      )}

      {/* Filters */}
      {!loading && rooms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
          {/* Left — filter pills */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex gap-1 bg-gray-50 rounded-lg p-0.5">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "closed", label: "Archived" },
                ] as { key: FilterType; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                    filter === f.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right — search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none w-48 transition-all"
            />
          </div>
        </div>
      )}

      {/* Room List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {[...Array(4)].map((_, i) => (
            <RoomSkeleton key={i} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-violet-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            No conversations yet
          </h3>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
            Once your application is approved by a charity, your chat room will
            appear here.
          </p>
          <button
            onClick={() => router.push("/user/opportunities")}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors cursor-pointer"
          >
            Browse opportunities
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <MagnifyingGlassIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No rooms match your search</p>
          <button
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
            className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((room) => {
              const isActive = room.status === "ACTIVE";
              const logo = resolveImage(room.opportunity.charity.logoUrl);

              return (
                <div
                  key={room.id}
                  onClick={() =>
                    router.push(`/user/rooms/${room.opportunityId}`)
                  }
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                  {/* Charity logo / icon */}
                  <div className="relative shrink-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={room.opportunity.charity.name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-gray-100"
                      />
                    ) : (
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          isActive
                            ? "bg-gradient-to-br from-violet-500 to-purple-600"
                            : "bg-gray-100"
                        }`}
                      >
                        <ChatBubbleLeftRightIcon
                          className={`h-5 w-5 ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                    {/* Active indicator dot */}
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                        {room.opportunity.title}
                      </h3>
                      {!isActive && (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <BuildingOffice2Icon className="h-3 w-3 text-gray-400" />
                        {room.opportunity.charity.name}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <CalendarDaysIcon className="h-3 w-3" />
                        {formatDate(room.opportunity.startDate)}
                        {room.opportunity.endDate &&
                          ` — ${formatDate(room.opportunity.endDate)}`}
                      </span>
                    </div>

                    {/* Last message preview */}
                    {room.lastMessage ? (
                      <p className="text-xs text-gray-500 truncate max-w-md">
                        <span className="font-semibold text-gray-700">
                          {room.lastMessage.sender.name}:
                        </span>{" "}
                        {room.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300 italic">
                        No messages yet
                      </p>
                    )}
                  </div>

                  {/* Right meta */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Time */}
                    <span className="text-[11px] text-gray-400 font-medium">
                      {room.lastMessage
                        ? timeAgo(room.lastMessage.createdAt)
                        : ""}
                    </span>

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <UserGroupIcon className="h-3 w-3" />
                        {room._count.members}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <ChatBubbleOvalLeftEllipsisIcon className="h-3 w-3" />
                        {room._count.messages}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ── Stat card ────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<
    string,
    { iconBg: string; iconText: string; valueBg: string }
  > = {
    violet: {
      iconBg: "bg-violet-50 border-violet-100",
      iconText: "text-violet-500",
      valueBg: "text-violet-600",
    },
    emerald: {
      iconBg: "bg-emerald-50 border-emerald-100",
      iconText: "text-emerald-500",
      valueBg: "text-emerald-600",
    },
    blue: {
      iconBg: "bg-blue-50 border-blue-100",
      iconText: "text-blue-500",
      valueBg: "text-blue-600",
    },
  };
  const c = colorMap[color] || colorMap.violet;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className={`h-7 w-7 rounded-lg border flex items-center justify-center ${c.iconBg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${c.iconText}`} />
        </div>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}