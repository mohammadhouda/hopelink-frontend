"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import charityApi from "@/lib/charityAxios";

/* ── types ──────────────────────────────────────────────────────────── */

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

/* ── icons ──────────────────────────────────────────────────────────── */

function IconHash({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
    </svg>
  );
}

function IconUsers({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconChat({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function IconLock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function IconMessages({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  );
}

/* ── helpers ────────────────────────────────────────────────────────── */

function relativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── component ─────────────────────────────────────────────────────── */

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  useEffect(() => {
    charityApi
      .get("/api/charity/rooms")
      .then((res) => setRooms(res.data?.data || []))
      .finally(() => setLoading(false));
  }, []);

  const active = rooms.filter((r) => r.status === "ACTIVE");
  const closed = rooms.filter((r) => r.status === "CLOSED");
  const filtered =
    filter === "active" ? active : filter === "closed" ? closed : rooms;

  const totalMessages = rooms.reduce((s, r) => s + r._count.messages, 0);
  const totalMembers = rooms.reduce((s, r) => s + r._count.members, 0);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl px-7 py-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <IconChat className="h-4.5 w-4.5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Chat Rooms
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-2 ml-12">
            Communicate with approved volunteers per opportunity.
          </p>

          {/* Stats row */}
          {!loading && rooms.length > 0 && (
            <div className="flex items-center gap-6 mt-5 ml-12">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-gray-300">
                  <span className="font-semibold text-white">{active.length}</span>{" "}
                  active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <IconLock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-300">{closed.length}</span>{" "}
                  closed
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <IconMessages className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-300">{totalMessages}</span>{" "}
                  messages
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <IconUsers className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-400">
                  <span className="font-semibold text-gray-300">{totalMembers}</span>{" "}
                  members
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      {!loading && rooms.length > 0 && (
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(["all", "active", "closed"] as const).map((f) => {
            const count =
              f === "all"
                ? rooms.length
                : f === "active"
                ? active.length
                : closed.length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer capitalize ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f === "active" && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      filter === f ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                )}
                {f === "closed" && (
                  <IconLock
                    className={`h-3 w-3 ${
                      filter === f ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                )}
                {f}
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    filter === f
                      ? "bg-gray-100 text-gray-600"
                      : "bg-transparent text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-50 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <IconChat className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">
            No chat rooms yet
          </p>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto">
            Rooms are created automatically when you approve a volunteer
            application.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-400">
            No {filter} rooms found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((room) => (
            <RoomCard
              key={room.opportunityId}
              room={room}
              onClick={() =>
                router.push(`/charity/rooms/${room.opportunityId}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Room card ─────────────────────────────────────────────────────── */

function RoomCard({ room, onClick }: { room: Room; onClick: () => void }) {
  const isActive = room.status === "ACTIVE";

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-50 transition-all duration-200 cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start gap-3.5">
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
            isActive
              ? "bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 group-hover:from-emerald-100 group-hover:to-teal-100"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <IconHash
            className={`h-5 w-5 ${
              isActive ? "text-emerald-600" : "text-gray-400"
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
            {room.opportunity.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Created {relativeTime(room.createdAt)}
          </p>
        </div>
        <div className="shrink-0">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
              <IconLock className="h-2.5 w-2.5" />
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Divider + stats */}
      <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <IconUsers className="h-3.5 w-3.5" />
            {room._count.members}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <IconMessages className="h-3.5 w-3.5" />
            {room._count.messages}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 text-xs font-medium text-emerald-600">
          Open
          <IconArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}