"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import userApi from "@/lib/userAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  UsersIcon,
  XMarkIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { useVolunteer } from "@/context/VolunteerContext";

interface Message {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  createdAt: string;
  sender: { id: number; name: string; baseProfile?: { avatarUrl?: string }; charityAccount?: { logoUrl?: string } };
}

interface RoomMember {
  id: number;
  userId: number;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  user: { id: number; name: string; email: string; baseProfile?: { avatarUrl?: string }; charityAccount?: { logoUrl?: string } };
}

interface RoomInfo {
  id: number;
  opportunityId: number;
  status: "ACTIVE" | "CLOSED";
  myRole: string;
  opportunity: {
    id: number;
    title: string;
    status: string;
    startDate?: string;
    endDate?: string;
    charity: { id: number; name: string; logoUrl?: string };
  };
  members: RoomMember[];
}

interface TypingUser { userId: number; name: string; }

function dedupeMessages(msgs: Message[]): Message[] {
  const seen = new Set<number>();
  return msgs.filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function Avatar({ name, avatarUrl, size = "md" }: { name: string; avatarUrl?: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const cls = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div className={`${cls} rounded-full bg-violet-100 flex items-center justify-center font-semibold text-violet-700 shrink-0 overflow-hidden`}>
      {avatarUrl
        ? <img src={getAvatarUrl(avatarUrl) || ""} alt={name} className="h-full w-full object-cover" />
        : initials}
    </div>
  );
}

export default function UserRoomPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const router = useRouter();
  const { volunteer } = useVolunteer();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const oppId = parseInt(opportunityId);

  // Fetch room info
  useEffect(() => {
    setLoadingRoom(true);
    userApi.get(`/api/user/rooms/${oppId}`)
      .then((res) => setRoom(res.data?.data || null))
      .catch(() => router.push("/user/rooms"))
      .finally(() => setLoadingRoom(false));
  }, [oppId]);

  // Fetch message history
  useEffect(() => {
    setLoadingMsgs(true);
    userApi.get(`/api/user/rooms/${oppId}/messages?limit=100`)
      .then((res) => setMessages(res.data?.data?.messages || []))
      .finally(() => setLoadingMsgs(false));
  }, [oppId]);

  // Socket.io
  useEffect(() => {
    const connect = async () => {
      try {
        const tokenRes = await userApi.get("/api/auth/socket-token");
        const token: string = tokenRes.data?.data?.token ?? tokenRes.data?.token ?? "";
        const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
          auth: { token },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join_room", { opportunityId: oppId });
        });

        socket.on("joined_room", () => {
          setSocketReady(true);
        });

        socket.on("new_message", (msg: Message) => {
          setMessages((prev) => dedupeMessages([...prev, msg]));
        });

        socket.on("user_typing", ({ userId, name, isTyping }: { userId: number; name: string; isTyping: boolean }) => {
          if (userId === volunteer?.id) return;
          setTypingUsers((prev) =>
            isTyping ? [...prev.filter((u) => u.userId !== userId), { userId, name }]
                     : prev.filter((u) => u.userId !== userId)
          );
        });

        socket.on("user_joined", () => {
          userApi.get(`/api/user/rooms/${oppId}`).then((r) => setRoom(r.data?.data || null));
        });
      } catch { /* ignore */ }
    };
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, [oppId]);

  // Auto-scroll
  useEffect(() => {
    if (!loadingMsgs) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMsgs]);

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending || !socketReady) return;
    setSending(true);
    setInput("");
    socketRef.current?.emit("send_message", { content });
    setSending(false);
  }, [input, sending, socketReady]);

  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current?.emit("typing", { isTyping: true });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socketRef.current?.emit("typing", { isTyping: false });
    }, 2000);
  };

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toDateString();
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) { last.messages.push(msg); }
    else { grouped.push({ date, messages: [msg] }); }
  });

  const isClosed = room?.status === "CLOSED";

  if (loadingRoom) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/user/rooms")}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{room.opportunity.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <BuildingOffice2Icon className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{room.opportunity.charity.name}</span>
              <span className={`ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                isClosed ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
              }`}>{room.status}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowMembers((v) => !v)}
          className="flex items-center gap-1.5 p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
        >
          <UsersIcon className="h-5 w-5" />
          <span className="text-xs font-medium hidden sm:block">{room.members.length}</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-1">
            {loadingMsgs ? (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
                  <PaperAirplaneIcon className="h-6 w-6 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to say hello!</p>
              </div>
            ) : (
              grouped.map(({ date, messages: dayMsgs }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[11px] font-medium text-gray-400 px-2">{formatDateHeader(dayMsgs[0].createdAt)}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  {dayMsgs.map((msg, idx) => {
                    const isMe = msg.sender.id === volunteer?.id;
                    const prevMsg = dayMsgs[idx - 1];
                    const sameSender = prevMsg && prevMsg.sender.id === msg.sender.id;

                    return (
                      <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"} ${sameSender ? "mt-0.5" : "mt-3"}`}>
                        {!isMe && (
                          sameSender
                            ? <div className="w-9 shrink-0" />
                            : <Avatar name={msg.sender.name} avatarUrl={ msg.sender.baseProfile?.avatarUrl ?? msg.sender.charityAccount?.logoUrl} />
                        )}
                        <div className={`group flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                          {!isMe && !sameSender && (
                            <span className="text-[11px] font-semibold text-gray-500 mb-1 px-1">{msg.sender.name}</span>
                          )}
                          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed wrap-break-word ${
                            isMe
                              ? "bg-violet-600 text-white rounded-br-sm"
                              : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm"
                          }`}>
                            {msg.content}
                          </div>
                          <span className={`text-[10px] text-gray-400 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        {isMe && <div className="w-0" />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2.5 mt-2">
                <div className="h-9 w-9" />
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3.5 py-2 flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">
                    {typingUsers.map((u) => u.name).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {isClosed ? (
            <div className="px-4 md:px-6 py-4 bg-white border-t border-gray-200">
              <p className="text-xs text-center text-gray-400">This room is closed. No new messages can be sent.</p>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="px-4 md:px-6 py-4 bg-white border-t border-gray-200 flex items-end gap-3">
              <input
                value={input}
                onChange={(e) => { setInput(e.target.value); handleTyping(); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent); } }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                disabled={!socketReady}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending || !socketReady}
                className="h-11 w-11 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          )}
        </div>

        {/* Members panel */}
        {showMembers && (
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-900">Members</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{room.members.length}</span>
              </div>
              <button onClick={() => setShowMembers(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {room.members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar name={m.user.name} avatarUrl={m.user.baseProfile?.avatarUrl ?? m.user.charityAccount?.logoUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {m.user.name}
                      {m.user.id === volunteer?.id && <span className="text-violet-500 ml-1">(you)</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.role.toLowerCase()}</p>
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
