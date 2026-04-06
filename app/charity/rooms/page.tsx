"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon, LockClosedIcon, LockOpenIcon, UsersIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";

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
const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    charityApi.get("/api/charity/rooms")
      .then((res) => setRooms(res.data?.data || []))
      .finally(() => setLoading(false));
  }, []);

  const active = rooms.filter((r) => r.status === "ACTIVE");
  const closed = rooms.filter((r) => r.status === "CLOSED");

const RoomCard = ({ room }: { room: Room }) => (
  <div
    onClick={() => router.push(`/charity/rooms/${room.opportunityId}`)}
    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
          room.status === "ACTIVE"
            ? "bg-emerald-50 border border-emerald-200"
            : "bg-gray-50 border border-gray-200"
        }`}>
          {room.status === "ACTIVE" ? (
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" />
          ) : (
            <LockClosedIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{room.opportunity.title}</p>
          {room._count.messages > 0 ? (
            <p className="text-xs text-gray-400 mt-0.5">{room._count.messages} message{room._count.messages !== 1 ? "s" : ""}</p>
          ) : (
            <p className="text-xs text-gray-300 mt-0.5">No messages yet</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
          room.status === "ACTIVE"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
          {room.status}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
      <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
      <span className="text-xs text-gray-400">{room._count.members} member{room._count.members !== 1 ? "s" : ""}</span>
    </div>
  </div>
);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Chat Rooms</h1>
        <p className="text-sm text-gray-500 mt-1">
          Communicate with approved volunteers per opportunity.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No chat rooms yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Rooms are created automatically when you approve a volunteer application.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LockOpenIcon className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-gray-700">Active Rooms</h2>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {active.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((r) => <RoomCard key={r.opportunityId} room={r} />)}
              </div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LockClosedIcon className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">Closed Rooms</h2>
                <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                  {closed.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {closed.map((r) => <RoomCard key={r.opportunityId} room={r} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
