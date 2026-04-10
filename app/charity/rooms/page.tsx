"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
  HashtagIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";

/* ── types ────────────────────────────────────────────────── */
interface Room {
  id: number;
  opportunityId: number;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
  closedAt: string | null;
  opportunity: {
    id: number;
    title: string;
    status: string;
    endDate: string;
  };
  members: { id: number }[];
  _count: {
    members: number;
    messages: number;
  };
}

type FilterType = "all" | "active" | "closed";

/* ── helpers ──────────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(iso?: string | null) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── skeleton ─────────────────────────────────────────────── */
function RoomSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="h-11 w-11 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-3 w-32 bg-gray-50 rounded animate-pulse" />
      </div>
      <div className="h-3 w-16 bg-gray-50 rounded animate-pulse" />
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
    charityApi
      .get("/api/charity/rooms")
      .then((res) => setRooms(res.data?.data || []))
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
      return r.opportunity.title.toLowerCase().includes(search.toLowerCase());
    });

  const activeCount = rooms.filter((r) => r.status === "ACTIVE").length;
  const closedCount = rooms.filter((r) => r.status === "CLOSED").length;
  const totalMessages = rooms.reduce((sum, r) => sum + r._count.messages, 0);
  const totalMembers = rooms.reduce((sum, r) => sum + r._count.members, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chat Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Communicate with approved volunteers per opportunity.
          </p>
        </div>
        {!loading && rooms.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {activeCount} active
            </div>
            {closedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                <LockClosedIcon className="h-3 w-3" />
                {closedCount} closed
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && rooms.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard icon={ChatBubbleLeftRightIcon} label="Total Rooms" value={rooms.length} color="emerald" />
          <StatCard icon={UserGroupIcon} label="Total Members" value={totalMembers} color="blue" />
          <StatCard icon={ChatBubbleOvalLeftEllipsisIcon} label="Messages" value={totalMessages} color="amber" />
          <StatCard icon={CalendarDaysIcon} label="Active" value={activeCount} color="green" />
        </div>
      )}

      {/* Filters */}
      {!loading && rooms.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4">
          {/* Left — filter pills */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex gap-1 bg-gray-50 rounded-lg p-0.5">
              {([
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "closed", label: "Closed" },
              ] as { key: FilterType; label: string }[]).map((f) => (
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
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none w-48 transition-all"
            />
          </div>
        </div>
      )}

      {/* Room List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
          {[...Array(5)].map((_, i) => (
            <RoomSkeleton key={i} />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-emerald-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No chat rooms yet</h3>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs mx-auto">
            Rooms are created automatically when you approve a volunteer application.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <MagnifyingGlassIcon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">No rooms match your search</p>
          <button
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((room) => {
              const isActive = room.status === "ACTIVE";

              return (
                <div
                  key={room.id}
                  onClick={() => router.push(`/charity/rooms/${room.opportunityId}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                >
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-colors ${
                      isActive
                        ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 group-hover:from-emerald-100 group-hover:to-teal-100"
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <HashtagIcon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                    </div>
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                        {room.opportunity.title}
                      </h3>
                      {!isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                          <LockClosedIcon className="h-2.5 w-2.5" />
                          Closed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        Created {timeAgo(room.createdAt)}
                      </span>
                      {room.opportunity.endDate && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <CalendarDaysIcon className="h-3 w-3" />
                            Ends {formatDate(room.opportunity.endDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                      {room._count.members}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <ChatBubbleOvalLeftEllipsisIcon className="h-3.5 w-3.5" />
                      {room._count.messages}
                    </span>
                  </div>

                  {/* Status + arrow */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                        <LockClosedIcon className="h-2.5 w-2.5" />
                        Closed
                      </span>
                    )}
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
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
  const colorMap: Record<string, { iconBg: string; iconText: string }> = {
    emerald: { iconBg: "bg-emerald-50 border-emerald-100", iconText: "text-emerald-500" },
    blue: { iconBg: "bg-blue-50 border-blue-100", iconText: "text-blue-500" },
    amber: { iconBg: "bg-amber-50 border-amber-100", iconText: "text-amber-500" },
    green: { iconBg: "bg-green-50 border-green-100", iconText: "text-green-500" },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center ${c.iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${c.iconText}`} />
        </div>
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}