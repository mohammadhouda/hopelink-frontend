"use client";
import { useState } from "react";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { getAvatarUrl } from "@/lib/avatarUrl";

// ── Types ──────────────────────────────────────────────────────────────────
export interface PostAuthor {
  id: number;
  name: string;
  role: string;
  baseProfile?: { avatarUrl?: string | null; city?: string | null } | null;
  charityAccount?: { name: string; logoUrl?: string | null } | null;
}

export interface CommentData {
  id: number;
  content: string;
  createdAt: string;
  author: PostAuthor;
}

export interface PostData {
  id: number;
  content: string;
  imageUrl?: string | null;
  postType: "GENERAL" | "CERTIFICATE" | "PROJECT";
  createdAt: string;
  author: PostAuthor;
  likedByMe: boolean;
  likesCount: number;
  commentsCount: number;
}

interface PostCardProps {
  post: PostData;
  currentUserId: number;
  /** axios instance (userApi or charityApi) */
  api: { post: (url: string, data?: unknown) => Promise<unknown>; delete: (url: string) => Promise<unknown>; get: (url: string) => Promise<{ data: { data: unknown } }> };
  onDeleted: (id: number) => void;
  /** accent colour for like / badges — "violet" for user, "emerald" for charity */
  accent?: "violet" | "emerald";
}

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ author }: { author: PostAuthor }) {
  const rawPath =
    author.role === "CHARITY"
      ? author.charityAccount?.logoUrl
      : author.baseProfile?.avatarUrl;
  const imgUrl = getAvatarUrl(rawPath);
  const displayName =
    author.role === "CHARITY" ? author.charityAccount?.name ?? author.name : author.name;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={displayName}
        className="h-10 w-10 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
      <span className="text-xs font-semibold text-gray-500">{initials}</span>
    </div>
  );
}

const TYPE_BADGE: Record<string, string> = {
  CERTIFICATE: "bg-amber-100 text-amber-700",
  PROJECT: "bg-blue-100 text-blue-700",
  GENERAL: "",
};

const TYPE_LABEL: Record<string, string> = {
  CERTIFICATE: "Certificate",
  PROJECT: "Project Update",
  GENERAL: "",
};

// ── Component ──────────────────────────────────────────────────────────────
export default function PostCard({
  post,
  currentUserId,
  api,
  onDeleted,
  accent = "violet",
}: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const accentLike =
    accent === "emerald"
      ? "text-emerald-600 hover:text-emerald-700"
      : "text-violet-600 hover:text-violet-700";

  const authorName =
    post.author.role === "CHARITY"
      ? post.author.charityAccount?.name ?? post.author.name
      : post.author.name;

  const roleBadge =
    post.author.role === "CHARITY"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-violet-100 text-violet-700";
  const roleLabel = post.author.role === "CHARITY" ? "Charity" : "Volunteer";

  async function handleLike() {
    try {
      const res = await api.post(`/api/posts/${post.id}/like`) as { data: { data: { liked: boolean; likesCount: number } } };
      const data = (res as { data: { data: { liked: boolean; likesCount: number } } }).data.data;
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch { /* silent */ }
  }

  async function handleDelete() {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/posts/${post.id}`);
      onDeleted(post.id);
    } catch { /* silent */ } finally {
      setDeleting(false);
    }
  }

  async function loadComments() {
    if (commentsLoaded) return;
    try {
      const res = await api.get(`/api/posts/${post.id}/comments?limit=50`);
      const data = (res as { data: { data: { comments: CommentData[] } } }).data.data;
      setComments(data.comments || []);
      setCommentsLoaded(true);
    } catch { /* silent */ }
  }

  async function handleToggleComments() {
    const next = !showComments;
    setShowComments(next);
    if (next) await loadComments();
  }

  async function handleSubmitComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/posts/${post.id}/comments`, { content: newComment.trim() });
      const comment = (res as { data: { data: CommentData } }).data.data;
      setComments((prev) => [...prev, comment]);
      setCommentsCount((n) => n + 1);
      setNewComment("");
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await api.delete(`/api/posts/${post.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((n) => Math.max(0, n - 1));
    } catch { /* silent */ }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <Avatar author={post.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900 truncate">{authorName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge}`}>{roleLabel}</span>
            {TYPE_LABEL[post.postType] && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[post.postType]}`}>
                {TYPE_LABEL[post.postType]}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {post.author.baseProfile?.city ? `${post.author.baseProfile.city} · ` : ""}
            {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.author.id === currentUserId && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="px-5 pb-3">
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full max-h-96 object-cover rounded-xl border border-gray-100"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            liked ? accentLike : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {liked ? (
            <HeartSolid className="h-4.5 w-4.5" />
          ) : (
            <HeartIcon className="h-4.5 w-4.5" />
          )}
          <span>{likesCount > 0 ? likesCount : ""} Like{likesCount !== 1 ? "s" : ""}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChatBubbleLeftIcon className="h-4.5 w-4.5" />
          <span>{commentsCount > 0 ? commentsCount : ""} Comment{commentsCount !== 1 ? "s" : ""}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-50 px-5 py-3 space-y-3">
          {comments.map((c) => {
            const cName =
              c.author.role === "CHARITY"
                ? c.author.charityAccount?.name ?? c.author.name
                : c.author.name;
            const cImg =
              c.author.role === "CHARITY"
                ? c.author.charityAccount?.logoUrl
                : c.author.baseProfile?.avatarUrl;
            return (
              <div key={c.id} className="flex items-start gap-2 group">
                {cImg ? (
                  <img src={getAvatarUrl(cImg)!} alt={cName} className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-gray-400">{cName[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-700">{cName}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-300">{timeAgo(c.createdAt)}</span>
                      {c.author.id === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-0.5"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{c.content}</p>
                </div>
              </div>
            );
          })}

          {/* Comment input */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className={`p-2 rounded-xl transition-colors ${
                newComment.trim()
                  ? accent === "emerald"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
