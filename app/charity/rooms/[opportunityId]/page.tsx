/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import charityApi from "@/lib/charityAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";

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
  id: number;
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

interface TypingUser {
  userId: number;
  name: string;
}

/* ── helpers ─────────────────────────────────────────────────────────── */

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
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday)
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateHeader(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function shouldShowDateHeader(msgs: Message[], idx: number) {
  if (idx === 0) return true;
  const prev = new Date(msgs[idx - 1].createdAt).toDateString();
  const curr = new Date(msgs[idx].createdAt).toDateString();
  return prev !== curr;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function decodeJwtId(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.id === "number" ? payload.id : null;
  } catch {
    return null;
  }
}

/* avatar colour palette */
const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-teal-500 to-cyan-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-pink-600",
  "from-indigo-500 to-blue-600",
];
function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

/* ── icons (inline SVGs to remove heroicons dep) ─────────────────── */

function IconArrowLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function IconSend({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
      />
    </svg>
  );
}

function IconUsers({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function IconLock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function IconX({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function IconHash({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"
      />
    </svg>
  );
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
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ── REST: initial data ───────────────────────────────────────────── */

  useEffect(() => {
    Promise.all([
      charityApi.get(`/api/charity/rooms/${opportunityId}`),
      charityApi.get(
        `/api/charity/rooms/${opportunityId}/messages?page=1&limit=30`
      ),
    ])
      .then(([rRes, mRes]) => {
        setRoom(rRes.data?.data || rRes.data);
        const msgData = mRes.data?.data || mRes.data;
        const msgs: Message[] = msgData.messages ?? [];
        setMessages(dedupeMessages(msgs));
        const total = msgData.total ?? 0;
        const limit = msgData.limit ?? 30;
        setHasMore(1 * limit < total);
      })
      .finally(() => setLoading(false));
  }, [opportunityId]);

  /* ── Socket ───────────────────────────────────────────────────────── */

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const tokenRes = await charityApi.get("/api/auth/socket-token");
        const token: string =
          tokenRes.data?.data?.token ?? tokenRes.data?.token ?? "";
        const uid = decodeJwtId(token);
        if (uid) setMyUserId(uid);

        const socket = io(process.env.NEXT_PUBLIC_API_URL ?? "", {
          auth: { token },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);
          socket.emit("join_room", {
            opportunityId: parseInt(opportunityId),
          });
        });

        socket.on("disconnect", () => setConnected(false));

        socket.on("new_message", (msg: Message) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(scrollToBottom, 50);
        });

        socket.on(
          "user_typing",
          (data: { userId: number; name: string; isTyping: boolean }) => {
            setTypingUsers((prev) => {
              if (data.isTyping) {
                return prev.some((u) => u.userId === data.userId)
                  ? prev
                  : [...prev, { userId: data.userId, name: data.name }];
              }
              return prev.filter((u) => u.userId !== data.userId);
            });
            if (data.isTyping) {
              setTimeout(() => {
                setTypingUsers((prev) =>
                  prev.filter((u) => u.userId !== data.userId)
                );
              }, 4000);
            }
          }
        );

        socket.on("error", (err: { message: string }) => {
          console.error("Socket error:", err.message);
        });
      } catch {
        /* socket-token endpoint not available */
      }
    };
    connectSocket();
    return () => {
      socketRef.current?.emit("leave_room");
      socketRef.current?.disconnect();
    };
  }, [opportunityId, scrollToBottom]);

  useEffect(() => {
    if (!loading) setTimeout(scrollToBottom, 100);
  }, [loading, scrollToBottom]);

  /* ── load older messages ─────────────────────────────────────────── */

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const nextPage = page + 1;
    const res = await charityApi.get(
      `/api/charity/rooms/${opportunityId}/messages?page=${nextPage}&limit=30`
    );
    const msgData = res.data?.data || res.data;
    const msgs: Message[] = msgData.messages ?? [];
    setMessages((prev) => dedupeMessages([...msgs, ...prev]));
    const total = msgData.total ?? 0;
    const limit = msgData.limit ?? 30;
    setHasMore(nextPage * limit < total);
    setPage(nextPage);
    setLoadingMore(false);

    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };

  /* ── send / typing ───────────────────────────────────────────────── */

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", { content: text.trim() });
    setText("");
  };

  const handleTyping = () => {
    socketRef.current?.emit("typing", { isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { isTyping: false });
    }, 2000);
  };

  const handleCloseRoom = async () => {
    if (
      !confirm(
        "Close this chat room? Volunteers will no longer be able to send messages."
      )
    )
      return;
    setClosing(true);
    try {
      await charityApi.patch(`/api/charity/rooms/${opportunityId}/close`);
      setRoom((prev) => (prev ? { ...prev, status: "CLOSED" } : prev));
    } finally {
      setClosing(false);
    }
  };

  /* ── group consecutive messages by same sender ─────────────────── */

  function isConsecutive(msgs: Message[], idx: number) {
    if (idx === 0) return false;
    const prev = msgs[idx - 1];
    const curr = msgs[idx];
    if (prev.senderId !== curr.senderId) return false;
    const gap =
      new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return gap < 120_000; // 2 min
  }

  /* ── render ──────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-200" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-600 animate-spin" />
          </div>
          <p className="text-sm text-gray-400 tracking-wide">
            Loading conversation…
          </p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IconHash className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">Room not found</p>
          <p className="text-xs text-gray-400 mt-1">
            This room may have been removed.
          </p>
        </div>
      </div>
    );
  }

  const isClosed = room.status === "CLOSED";
  const onlineCount = room.members.length;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative flex items-center gap-4">
          <button
            onClick={() => router.push("/charity/rooms")}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            <IconArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <IconHash className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-white leading-tight tracking-tight">
                {room.opportunity.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineCount} member{onlineCount !== 1 ? "s" : ""}
                </span>
                {isClosed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                    <IconLock className="h-2.5 w-2.5" /> Archived
                  </span>
                )}
                {!isClosed && connected && (
                  <span className="text-[10px] text-emerald-400/80">
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowMembers((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
              showMembers
                ? "bg-white/15 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <IconUsers className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
            <span className="bg-white/10 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
              {onlineCount}
            </span>
          </button>

          {!isClosed && (
            <button
              onClick={handleCloseRoom}
              disabled={closing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-40"
            >
              <IconLock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center py-3 border-b border-gray-100">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs font-medium text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <div className="h-3 w-3 rounded-full border border-gray-300 border-t-emerald-500 animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                      />
                    </svg>
                    Load older messages
                  </>
                )}
              </button>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-5"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center mb-4">
                  <IconSend className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  No messages yet
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                  Start the conversation with your volunteers — say hello!
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              {messages.map((msg, idx) => {
                const isMe =
                  myUserId !== null && msg.senderId === myUserId;
                const consecutive = isConsecutive(messages, idx);
                const showDate = shouldShowDateHeader(messages, idx);

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex items-center gap-3 my-6 first:mt-0">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                          {dateHeader(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    )}

                    {/* Message */}
                    <div
                      className={`flex gap-3 ${
                        isMe ? "flex-row-reverse" : "flex-row"
                      } ${consecutive ? "mt-0.5" : "mt-4 first:mt-0"}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 shrink-0">
                        {!consecutive && !isMe && (
                          <div
                            className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatarColor(
                              msg.senderId
                            )} flex items-center justify-center shadow-sm overflow-hidden`}
                          >
                            {msg.sender.baseProfile?.avatarUrl ? (
                              <img
                                src={
                                  msg.sender.baseProfile.avatarUrl.startsWith("http")
                                    ? msg.sender.baseProfile.avatarUrl
                                    : getAvatarUrl(msg.sender.baseProfile.avatarUrl)!
                                }
                                alt=""
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-[11px] font-bold text-white">
                                {getInitials(msg.sender.name)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[65%] flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        {!consecutive && !isMe && (
                          <span className="text-[11px] font-semibold text-gray-500 mb-1 px-1">
                            {msg.sender.name}
                          </span>
                        )}
                        <div
                          className={`group relative px-4 py-2.5 text-[13.5px] leading-relaxed ${
                            isMe
                              ? `bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/10 ${
                                  consecutive
                                    ? "rounded-2xl rounded-tr-lg"
                                    : "rounded-2xl rounded-tr-md"
                                }`
                              : `bg-white border border-gray-200/80 text-gray-800 shadow-sm ${
                                  consecutive
                                    ? "rounded-2xl rounded-tl-lg"
                                    : "rounded-2xl rounded-tl-md"
                                }`
                          }`}
                        >
                          {msg.content}
                        </div>
                        {!consecutive && (
                          <span
                            className={`text-[10px] text-gray-400 mt-1 px-1 ${
                              isMe ? "text-right" : ""
                            }`}
                          >
                            {timeLabel(msg.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex gap-3 mt-4">
                <div className="w-8" />
                <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">
                    {typingUsers.map((u) => u.name).join(", ")}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar ────────────────────────────────────────── */}
          <div className="bg-white border-t border-gray-200/80 px-5 py-3.5">
            {isClosed ? (
              <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 bg-gray-50 rounded-xl">
                <IconLock className="h-4 w-4" />
                This room has been archived — no new messages.
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="flex items-center gap-3"
              >
                <div className="relative flex-1">
                  <input
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Write a message…"
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed shrink-0"
                >
                  <IconSend className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Members Panel ──────────────────────────────────────── */}
        <div
          className={`bg-white border-l border-gray-200/80 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
            showMembers ? "w-72" : "w-0 border-l-0"
          }`}
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between min-w-[288px]">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Members</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {onlineCount} in this room
              </p>
            </div>
            <button
              onClick={() => setShowMembers(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-0.5 min-w-[288px]">
            {/* Admins */}
            {room.members.filter((m) => m.role === "ADMIN").length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  Organizers
                </p>
                {room.members
                  .filter((m) => m.role === "ADMIN")
                  .map((m) => (
                    <MemberRow key={m.id} member={m} />
                  ))}
              </div>
            )}

            {/* Members */}
            {room.members.filter((m) => m.role === "MEMBER").length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  Volunteers
                </p>
                {room.members
                  .filter((m) => m.role === "MEMBER")
                  .map((m) => (
                    <MemberRow key={m.id} member={m} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Member row subcomponent ─────────────────────────────────────── */

function MemberRow({ member: m }: { member: RoomMember }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
      <div
        className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarColor(
          m.userId
        )} flex items-center justify-center shadow-sm shrink-0`}
      >
        {m.user.baseProfile?.avatarUrl ? (
          <img
            src={m.user.baseProfile.avatarUrl}
            alt={m.user.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="text-[11px] font-bold text-white">
            {getInitials(m.user.name)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-gray-900 leading-tight truncate">
          {m.user.name}
        </p>
        <p className="text-[11px] text-gray-400">{m.user.email}</p>
      </div>
      {m.role === "ADMIN" && (
        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
          Admin
        </span>
      )}
    </div>
  );
}