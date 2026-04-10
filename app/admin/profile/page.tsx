"use client";
import { useState, useEffect, useRef } from "react";
import {
  UserCircleIcon,
  CameraIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";
import { getAvatarUrl } from "@/lib/avatarUrl";

/* ── types ────────────────────────────────────────────────── */
interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  phone: string;
  avatarUrl: string;
  city: string;
  country: string;
  bio: string;
}

/* ── skeleton ─────────────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="p-6 space-y-5">
      <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-50 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
    </div>
  );
}

/* ── toast ─────────────────────────────────────────────────── */
function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
      type === "success"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-700 border-red-200"
    }`}>
      {type === "success" ? (
        <CheckCircleIcon className="h-4 w-4" />
      ) : (
        <ExclamationCircleIcon className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                */
/* ══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    api.get("/api/admin/profile")
      .then((res) => setProfile(res.data))
      .catch(() => setToast({ type: "error", message: "Failed to load profile" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and security.</p>
      </div>

      {profile ? (
        <div className="grid grid-cols-3 gap-5">
          {/* Left column */}
          <div className="col-span-1 space-y-4">
            <AvatarCard profile={profile} setProfile={setProfile} setToast={setToast} />
            <QuickInfoCard profile={profile} />
          </div>

          {/* Right column */}
          <div className="col-span-2 space-y-5">
            <PersonalInfoForm profile={profile} setProfile={setProfile} setToast={setToast} />
            <ChangePasswordForm setToast={setToast} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-gray-400">Failed to load profile data.</div>
      )}
    </div>
  );
}

/* ── Avatar card with upload ──────────────────────────────── */
function AvatarCard({
  profile,
  setProfile,
  setToast,
}: {
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  setToast: (t: { type: "success" | "error"; message: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = profile?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) {
      setToast({ type: "error", message: "Please upload a JPG, PNG, WebP, or SVG image" });
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setToast({ type: "error", message: "Image must be under 2MB" });
      return;
    }

    setUploading(true);
    try {
      // Upload the file using existing upload endpoint
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await api.post("/api/upload/single?bucket=logos&folder=profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = uploadRes.data.data.url;

      // Update the profile with the new avatar URL
      const profileRes = await api.put("/api/admin/profile/avatar", { avatarUrl });
      setProfile(profileRes.data);
      setToast({ type: "success", message: "Avatar updated" });
    } catch {
      setToast({ type: "error", message: "Failed to upload avatar" });
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    try {
      const res = await api.put("/api/admin/profile/avatar", { avatarUrl: "" });
      setProfile(res.data);
      setToast({ type: "success", message: "Avatar removed" });
    } catch {
      setToast({ type: "error", message: "Failed to remove avatar" });
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className={`h-24 w-24 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center overflow-hidden ${
            uploading ? "opacity-50" : ""
          }`}>
            {profile.avatarUrl ? (
              <img src={getAvatarUrl(profile.avatarUrl)!} alt={profile.name} className="h-full w-full object-cover object-center" />
            ) : (
              <span className="text-2xl font-bold text-blue-600">{initials}</span>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
                <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CameraIcon className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        <h2 className="text-base font-bold text-gray-900 mt-3">{profile.name}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>

        <span className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {profile.role}
        </span>

        {profile.avatarUrl && (
          <button
            onClick={handleRemoveAvatar}
            className="mt-3 flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <TrashIcon className="h-3 w-3" />
            Remove avatar
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Quick info card ──────────────────────────────────────── */
function QuickInfoCard({ profile }: { profile: ProfileData }) {
  function formatDate(iso: string | null) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Info</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Member since</span>
          <span className="text-xs font-medium text-gray-700">{formatDate(profile.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Last login</span>
          <span className="text-xs font-medium text-gray-700">{formatDate(profile.lastLoginAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Location</span>
          <span className="text-xs font-medium text-gray-700">
            {[profile.city, profile.country].filter(Boolean).join(", ") || "Not set"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Personal info form ───────────────────────────────────── */
function PersonalInfoForm({
  profile,
  setProfile,
  setToast,
}: {
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  setToast: (t: { type: "success" | "error"; message: string }) => void;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    bio: profile.bio,
  });
  const [saving, setSaving] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Name is required" });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/api/admin/profile", form);
      setProfile(res.data);
      setToast({ type: "success", message: "Profile updated successfully" });
    } catch {
      setToast({ type: "error", message: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
          <UserCircleIcon className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
          <p className="text-[11px] text-gray-400">Update your name, contact info, and bio.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Full Name *</label>
            <input type="text" value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Email</label>
            <input type="email" value={profile.email} disabled
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Phone</label>
            <input type="tel" value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+961 ..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">City</label>
            <input type="text" value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. Byblos"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-gray-500 block mb-1">Country</label>
          <input type="text" value={form.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="e.g. Lebanon"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none max-w-xs" />
        </div>

        <div>
          <label className="text-[11px] font-medium text-gray-500 block mb-1">Bio</label>
          <textarea value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="Tell us a bit about yourself..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none resize-none" />
        </div>
      </div>

      <div className="flex items-center justify-end mt-5 pt-4 border-t border-gray-100">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ── Change password form ─────────────────────────────────── */
function ChangePasswordForm({
  setToast,
}: {
  setToast: (t: { type: "success" | "error"; message: string }) => void;
}) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setToast({ type: "error", message: "All password fields are required" });
      return;
    }

    if (form.newPassword.length < 8) {
      setToast({ type: "error", message: "New password must be at least 8 characters" });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setToast({ type: "error", message: "New passwords do not match" });
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setToast({ type: "error", message: "New password must be different from current" });
      return;
    }

    setSaving(true);
    try {
      await api.put("/api/admin/profile/password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setToast({ type: "success", message: "Password changed successfully" });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to change password";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  }

  const strength = getPasswordStrength(form.newPassword);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
          <KeyIcon className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Change Password</h3>
          <p className="text-[11px] text-gray-400">Update your password to keep your account secure.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-medium text-gray-500 block mb-1">Current Password</label>
          <div className="relative max-w-sm">
            <input type={showCurrent ? "text" : "password"} value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
              {showCurrent ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-gray-500 block mb-1">New Password</label>
          <div className="relative max-w-sm">
            <input type={showNew ? "text" : "password"} value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
              {showNew ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {form.newPassword && (
            <div className="mt-2 max-w-sm">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= strength.level
                        ? strength.level <= 1 ? "bg-red-400"
                          : strength.level <= 2 ? "bg-amber-400"
                          : strength.level <= 3 ? "bg-blue-400"
                          : "bg-emerald-400"
                        : "bg-gray-200"
                    }`} />
                ))}
              </div>
              <p className={`text-[10px] mt-1 font-medium ${
                strength.level <= 1 ? "text-red-500"
                  : strength.level <= 2 ? "text-amber-500"
                  : strength.level <= 3 ? "text-blue-500"
                  : "text-emerald-500"
              }`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="text-[11px] font-medium text-gray-500 block mb-1">Confirm New Password</label>
          <div className="max-w-sm">
            <input type="password" value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 focus:bg-white focus:ring-1 outline-none ${
                form.confirmPassword && form.confirmPassword !== form.newPassword
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-300 focus:ring-blue-100"
              }`} />
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p className="text-[10px] text-red-500 font-medium mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end mt-5 pt-4 border-t border-gray-100">
        <button onClick={handleSubmit}
          disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
          {saving ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}

/* ── Password strength helper ─────────────────────────────── */
function getPasswordStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Weak" };
  if (score <= 2) return { level: 2, label: "Fair" };
  if (score <= 3) return { level: 3, label: "Good" };
  return { level: 4, label: "Strong" };
}