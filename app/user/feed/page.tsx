"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusIcon, NewspaperIcon } from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import PostCard, { PostData } from "@/components/ui/PostCard";
import CreatePostModal from "@/components/ui/CreatePostModal";
import { getAvatarUrl } from "@/lib/avatarUrl";

interface Me {
  id: number;
  name: string;
  role: string;
  baseProfile?: { avatarUrl?: string | null } | null;
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} />
);

export default function UserFeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const limit = 10;

  // Fetch current user identity
  useEffect(() => {
    userApi.get("/api/user/profile").then((res) => {
      const d = res.data?.data;
      if (d) setMe({ id: d.id, name: d.name, role: d.role, baseProfile: d.baseProfile });
    }).catch(() => {});
  }, []);

  const loadPosts = useCallback(async (p: number, replace = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await userApi.get(`/api/posts?page=${p}&limit=${limit}`);
      const data = res.data?.data;
      const fetched: PostData[] = data?.posts ?? [];
      setPosts((prev) => replace ? fetched : [...prev, ...fetched]);
      setTotal(data?.total ?? 0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPosts(1, true); }, [loadPosts]);

  function handleCreated(post: unknown) {
    setPosts((prev) => [post as PostData, ...prev]);
    setTotal((n) => n + 1);
    setShowCreate(false);
  }

  function handleDeleted(id: number) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((n) => Math.max(0, n - 1));
  }

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    loadPosts(next);
  }

  const hasMore = posts.length < total;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Community Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">Updates from volunteers and charities.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          New Post
        </button>
      </div>

      {/* Create post shortcut */}
      {me && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          {me.baseProfile?.avatarUrl ? (
            <img src={getAvatarUrl(me.baseProfile.avatarUrl)!} alt={me.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-violet-600">{me.name[0]?.toUpperCase()}</span>
            </div>
          )}
          <span className="text-sm text-gray-400">Share a certificate, achievement or update…</span>
        </button>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-24 text-center">
          <NewspaperIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">No posts yet</p>
          <p className="text-xs text-gray-300 mt-1">Be the first to share something with the community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={me?.id ?? 0}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              api={userApi as any}
              onDeleted={handleDeleted}
              accent="violet"
            />
          ))}

          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 text-sm font-medium text-violet-600 border border-violet-200 rounded-xl hover:bg-violet-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          api={userApi as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadApi={userApi as any}
          accent="violet"
          showProjectType={false}
        />
      )}
    </div>
  );
}
