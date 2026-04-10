"use client";
import { useState, useRef } from "react";
import { XMarkIcon, PhotoIcon, DocumentCheckIcon, FolderIcon } from "@heroicons/react/24/outline";

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: (post: unknown) => void;
  /** axios instance */
  api: {
    post: (url: string, data?: unknown) => Promise<{ data: { data: unknown } }>;
  };
  uploadApi: {
    post: (url: string, data: FormData, config: { headers: Record<string, string> }) => Promise<{ data: { data: { url: string } } }>;
  };
  accent?: "violet" | "emerald";
  /** For charity portals — show PROJECT option */
  showProjectType?: boolean;
}

type PostType = "GENERAL" | "CERTIFICATE" | "PROJECT";

const TYPE_OPTIONS: { value: PostType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "GENERAL", label: "General Post", icon: FolderIcon, description: "Share an update or thought" },
  { value: "CERTIFICATE", label: "Certificate", icon: DocumentCheckIcon, description: "Share a certificate you earned" },
  { value: "PROJECT", label: "Project Update", icon: FolderIcon, description: "Share an update about a project" },
];

export default function CreatePostModal({
  onClose,
  onCreated,
  api,
  uploadApi,
  accent = "violet",
  showProjectType = false,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("GENERAL");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const accentBtn =
    accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-200"
      : "bg-violet-600 hover:bg-violet-700 disabled:bg-violet-200";

  const accentRing =
    accent === "emerald"
      ? "focus:ring-emerald-300 focus:border-emerald-400"
      : "focus:ring-violet-300 focus:border-violet-400";

  const visibleTypes = showProjectType
    ? TYPE_OPTIONS
    : TYPE_OPTIONS.filter((t) => t.value !== "PROJECT");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) { setError("Post content is required."); return; }
    setError("");

    let imageUrl: string | undefined;

    if (imageFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await uploadApi.post("/api/upload/single?bucket=logos&folder=posts", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = res.data.data.url;
      } catch {
        setError("Image upload failed. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/posts", {
        content: content.trim(),
        postType,
        imageUrl,
      });
      onCreated(res.data.data);
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = uploading || submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Post type selector */}
          <div className="flex gap-2">
            {visibleTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPostType(t.value)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  postType === t.value
                    ? accent === "emerald"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="What's on your mind? Share an update, certificate, or achievement…"
            className={`w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 resize-none transition ${accentRing}`}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-white/90 text-gray-600 hover:text-red-500 rounded-full p-1 shadow transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <PhotoIcon className="h-5 w-5" />
              {imageFile ? "Change photo" : "Add photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !content.trim()}
                className={`px-5 py-2 rounded-xl text-sm font-medium text-white transition-all ${accentBtn}`}
              >
                {busy ? (uploading ? "Uploading…" : "Posting…") : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
