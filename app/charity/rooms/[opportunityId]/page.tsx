"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeftIcon, PaperAirplaneIcon, UsersIcon, LockClosedIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";

/* ── types ──────────────────────────────────────────────────────────── */

interface Message {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    baseProfile?: { avatarUrl?: string };
  };
}

interface RoomMember {
  id: number;     // RoomMember row id
  userId: number;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    baseProfile?: { avatarUrl?: string };
  };
}

interface RoomInfo {
  id: number;
  opportunityId: number;
  status: "ACTIVE" | "CLOSED";
  opportunity: { id: number; title: string; status: string; endDate: string };
  members: RoomMember[];
}

interface TypingUser { userId: number; name: string }

/* ── helpers ─────────────────────────────────────────────────────────── */

// helper at the top of your component or in a utils file
function dedupeMessages(msgs: Message[]): Message[] {
  const seen = new Set<number>();
  return msgs.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr);
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Decode a JWT payload without verifying the signature (client-side id extraction only). */
function decodeJwtId(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.id === "number" ? payload.id : null;
  } catch {
    return null;
  }
}

/* ── component ───────────────────────────────────────────────────────── */

export default function ChatRoomPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [closing, setClosing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [myUserId, setMyUserId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── REST: initial data ───────────────────────────────────────────── */

  useEffect(() => {
    Promise.all([
      charityApi.get(`/api/charity/rooms/${opportunityId}`),
      charityApi.get(`/api/charity/rooms/${opportunityId}/messages?page=1&limit=30`),
    ]).then(([rRes, mRes]) => {
      setRoom(rRes.data?.data || rRes.data);

      const msgData = mRes.data?.data || mRes.data;
      const msgs: Message[] = msgData.messages ?? [];

      setMessages(dedupeMessages(msgs));

      const total = msgData.total ?? 0;
      const limit = msgData.limit ?? 30;
      setHasMore(1 * limit < total);
    }).finally(() => setLoading(false));
  }, [opportunityId]);

  /* ── Socket ───────────────────────────────────────────────────────── */

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const tokenRes = await charityApi.get("/api/auth/socket-token");
        const token: string = tokenRes.data?.data?.token ?? tokenRes.data?.token ?? "";

        const uid = decodeJwtId(token);
        if (uid) setMyUserId(uid);

        const socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
          auth: { token },
          transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join_room", { opportunityId: parseInt(opportunityId) });
        });

        socket.on("new_message", (msg: Message) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev; // already have it
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 50);
        });

        socket.on("user_typing", (data: { userId: number; name: string; isTyping: boolean }) => {
          setTypingUsers((prev) => {
            if (data.isTyping) {
              return prev.some((u) => u.userId === data.userId)
                ? prev
                : [...prev, { userId: data.userId, name: data.name }];
            }
            return prev.filter((u) => u.userId !== data.userId);
          });

          // Safety-net auto-clear in case isTyping:false is never received
          if (data.isTyping) {
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            }, 4000);
          }
        });

        socket.on("error", (err: { message: string }) => {
          console.error("Socket error:", err.message);
        });
      } catch {
        // /api/auth/socket-token not yet created — real-time disabled gracefully
      }
    };

    connectSocket();

    return () => {
      socketRef.current?.emit("leave_room");
      socketRef.current?.disconnect();
    };
  }, [opportunityId, scrollToBottom]);

  // Scroll to bottom after initial load
  useEffect(() => {
    if (!loading) setTimeout(scrollToBottom, 100);
  }, [loading, scrollToBottom]);

  /* ── load older messages ─────────────────────────────────────────── */

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await charityApi.get(
      `/api/charity/rooms/${opportunityId}/messages?page=${nextPage}&limit=30`,
    );
    const msgData = res.data?.data || res.data;
    const msgs: Message[] = msgData.messages ?? [];

    setMessages((prev) => dedupeMessages([...msgs, ...prev]));

    const total = msgData.total ?? 0;
    const limit = msgData.limit ?? 30;
    setHasMore(nextPage * limit < total);
    setPage(nextPage);
    setLoadingMore(false);
  };

  /* ── send message ────────────────────────────────────────────────── */

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit("send_message", { content: text.trim() });
    setText("");
  };

  /* ── typing indicator ────────────────────────────────────────────── */

  const handleTyping = () => {
    
    socketRef.current?.emit("typing", { isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { isTyping: false });
    }, 2000);
  };

  /* ── close room ──────────────────────────────────────────────────── */

  const handleCloseRoom = async () => {
    if (!confirm("Close this chat room? Volunteers will no longer be able to send messages.")) return;
    setClosing(true);
    try {
      await charityApi.patch(`/api/charity/rooms/${opportunityId}/close`);
      setRoom((prev) => prev ? { ...prev, status: "CLOSED" } : prev);
    } finally {
      setClosing(false);
    }
  };

  /* ── render ──────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-4 max-w-4xl">
        <div className="animate-pulse h-6 w-48 bg-gray-200 rounded" />
        <div className="animate-pulse flex-1 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!room) {
    return <div className="text-sm text-gray-500 p-6">Room not found.</div>;
  }

  const isClosed = room.status === "CLOSED";

  return (
    <div className="flex flex-col h-full max-w-4xl -m-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/charity/rooms")}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div>
            
            <h1 className="text-sm font-bold text-gray-900">{room.opportunity.title}</h1>
            <p className="text-xs text-gray-400">
              {room.members.length} member{room.members.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isClosed && (
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <LockClosedIcon className="h-3 w-3" /> Closed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <UsersIcon className="h-4 w-4" /> Members
          </button>
          {!isClosed && (
            <button
              onClick={handleCloseRoom}
              disabled={closing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              <LockClosedIcon className="h-3.5 w-3.5" /> Close Room
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Load older messages */}
          <div className="flex justify-center py-2 bg-gray-50 border-b border-gray-100">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer disabled:opacity-60"
              >
                {loadingMore ? "Loading..." : "Load older messages"}
              </button>
            ) : (
              <span className="text-xs text-gray-400">Beginning of conversation</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                  <PaperAirplaneIcon className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Start the conversation with your volunteers.</p>
              </div>
            )}
            {messages.map((msg) => {
              
              const isMe = myUserId !== null && msg.senderId === myUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && (
                      <span className="text-[11px] font-semibold text-gray-500 px-1">
                        {msg.sender.name}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">{timeLabel(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">
                    {typingUsers.map((u) => u.name).join(", ")}{" "}
                    {typingUsers.length === 1 ? "is" : "are"} typing
                  </span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-4 py-3">
            {isClosed ? (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                <LockClosedIcon className="h-4 w-4" />
                This room is closed. No new messages can be sent.
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  value={text}
                  onChange={(e) => { setText(e.target.value); handleTyping(); }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white hover:from-emerald-600 hover:to-teal-700 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Members panel */}
        {showMembers && (
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Members <span className="text-gray-400 font-normal">({room.members.length})</span>
              </h3>
              <button
                onClick={() => setShowMembers(false)}
                className="p-1 rounded text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {room.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    m.role === "ADMIN" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {m.user.baseProfile?.avatarUrl ? (
                      <img
                        src={m.user.baseProfile.avatarUrl}
                        alt={m.user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      m.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight truncate">{m.user.name}</p>
                    <p className={`text-[10px] font-medium ${m.role === "ADMIN" ? "text-emerald-600" : "text-gray-400"}`}>
                      {m.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
