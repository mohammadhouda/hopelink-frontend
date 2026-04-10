"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ArrowRightIcon,
  UserGroupIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";

// --- Types ---
interface Room {
  id: number;
  opportunityId: number;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
  myRole: string;
  joinedAt: string;
  lastMessage?: { id: number; content: string; createdAt: string; sender: { name: string } } | null;
  opportunity: {
    id: number;
    title: string;
    startDate?: string;
    endDate?: string;
    charity: { id: number; name: string; logoUrl?: string };
  };
  _count: { members: number; messages: number };
}

// --- Components ---
const Skeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
    <div className="flex gap-4 items-center mb-4">
      <div className="h-12 w-12 bg-gray-100 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-50 rounded w-1/2" />
      </div>
    </div>
    <div className="h-10 bg-gray-50 rounded-lg w-full mb-4" />
    <div className="flex justify-between">
      <div className="h-3 bg-gray-50 rounded w-20" />
      <div className="h-3 bg-gray-50 rounded w-20" />
    </div>
  </div>
);

function formatDate(iso?: string | null) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.get("/api/user/rooms")
      .then((res) => setRooms(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const active = rooms.filter((r) => r.status === "ACTIVE");
  const closed = rooms.filter((r) => r.status === "CLOSED");

  const RoomCard = ({ room }: { room: Room }) => {
    const isActive = room.status === "ACTIVE";

    return (
      <div
        onClick={() => router.push(`/user/rooms/${room.opportunityId}`)}
        className="group relative bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-violet-200 hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Icon Container */}
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
              isActive 
                ? "bg-violet-600 text-white shadow-violet-100" 
                : "bg-gray-100 text-gray-400"
            }`}>
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </div>
            
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                {room.opportunity.title}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <BuildingOffice2Icon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-500 font-medium truncate">
                  {room.opportunity.charity.name}
                </span>
              </div>
            </div>
          </div>

          <div className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-lg border ${
            isActive 
              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
              : "bg-gray-50 text-gray-500 border-gray-100"
          }`}>
            {room.status}
          </div>
        </div>

        {/* Message Preview */}
        <div className="mb-5">
          {room.lastMessage ? (
            <div className="bg-gray-50/80 border border-gray-100 rounded-xl px-3 py-2.5 group-hover:bg-violet-50/30 group-hover:border-violet-100 transition-colors">
              <p className="text-xs text-gray-600 line-clamp-1">
                <span className="font-bold text-gray-900">{room.lastMessage.sender.name}:</span>{" "}
                {room.lastMessage.content}
              </p>
            </div>
          ) : (
            <div className="px-3 py-2.5 border border-dashed border-gray-200 rounded-xl">
              <p className="text-xs text-gray-400 italic">No messages yet...</p>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-500">
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold">{room._count.members}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-semibold">{room._count.messages}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
             <CalendarDaysIcon className="h-4 w-4" />
             <span className="text-[11px] font-medium uppercase tracking-tight">{formatDate(room.opportunity.startDate)}</span>
             <ArrowRightIcon className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            Collaborate with charities and stay updated on your volunteering roles.
          </p>
        </div>
        {!loading && rooms.length > 0 && (
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                Total Rooms: {rooms.length}
            </div>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="h-20 w-20 bg-violet-50 text-violet-400 rounded-full flex items-center justify-center mb-6">
            <ChatBubbleLeftRightIcon className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No active conversations</h3>
          <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">
            Once your application is approved by a charity, your dedicated chat room will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-[0.2em]">Active Rooms</h2>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {active.map((r) => <RoomCard key={r.id} room={r} />)}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Archived</h2>
                <div className="h-px flex-1 bg-gray-50" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-80 grayscale-[0.5] hover:grayscale-0 transition-all">
                {closed.map((r) => <RoomCard key={r.id} room={r} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}