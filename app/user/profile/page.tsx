"use client";
import { useState, useEffect, useRef } from "react";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CameraIcon
} from "@heroicons/react/24/outline";
import { useVolunteer } from "@/context/VolunteerContext";
import userApi from "@/lib/userAxios";
import { getAvatarUrl } from "@/lib/avatarUrl";

interface Profile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  baseProfile?: { phone?: string; city?: string; country?: string; bio?: string; avatarUrl?: string } | null;
  volunteerProfile?: {
    isAvailable: boolean;
    availabilityDays: string[];
    experience?: string;
    skills: { id: number; skill: string }[];
    preferences: { id: number; type: string; value: string }[];
  } | null;
  _count?: { opportunityApplications: number; certificates: number; ratingsReceived: number };
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all";
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_SHORT: Record<string, string> = { MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun" };

export default function ProfilePage() {
  const { refreshVolunteer } = useVolunteer();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", phone: "", city: "", country: "", bio: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingVolunteer, setEditingVolunteer] = useState(false);
  const [volForm, setVolForm] = useState({ isAvailable: true, availabilityDays: [] as string[], experience: "" });
  const [savingVol, setSavingVol] = useState(false);

  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

  // Password
  const [editingPassword, setEditingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = () => {
    setLoading(true);
    userApi.get("/api/user/profile")
      .then((res) => {
        const p = res.data?.data;
        setProfile(p);
        setInfoForm({
          name: p?.name || "",
          phone: p?.baseProfile?.phone || "",
          city: p?.baseProfile?.city || "",
          country: p?.baseProfile?.country || "",
          bio: p?.baseProfile?.bio || "",
        });
        setVolForm({
          isAvailable: p?.volunteerProfile?.isAvailable ?? true,
          availabilityDays: p?.volunteerProfile?.availabilityDays || [],
          experience: p?.volunteerProfile?.experience || "",
        });
        setSkills((p?.volunteerProfile?.skills || []).map((s: { skill: string }) => s.skill));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) return;
  if (file.size > 2 * 1024 * 1024) return;

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await userApi.post("/api/upload/single?bucket=logos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const avatarPath = uploadRes.data.data.path;
    await userApi.patch("/api/user/profile", { avatarUrl: avatarPath });
    fetchProfile();
    refreshVolunteer();
  } catch {
    // silent
  } finally {
    setUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }
};

const handleRemoveAvatar = async () => {
  setUploading(true);
  try {
    await userApi.patch("/api/user/profile", { avatarUrl: "" });
    fetchProfile();
    refreshVolunteer();
  } catch {
    // silent
  } finally {
    setUploading(false);
  }
};

  const saveInfo = async () => {
    setSavingInfo(true);
    try {
      await userApi.patch("/api/user/profile", infoForm);
      setEditingInfo(false);
      fetchProfile();
      refreshVolunteer();
    } finally {
      setSavingInfo(false);
    }
  };

  const saveVolunteer = async () => {
    setSavingVol(true);
    try {
      await userApi.patch("/api/user/profile", volForm);
      setEditingVolunteer(false);
      fetchProfile();
    } finally {
      setSavingVol(false);
    }
  };

  const saveSkills = async () => {
    setSavingSkills(true);
    try {
      await userApi.patch("/api/user/profile/skills", { skills });
      fetchProfile();
    } finally {
      setSavingSkills(false);
    }
  };

  const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("Passwords do not match."); return; }
    if (pwForm.newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setSavingPw(true);
    setPwError("");
    try {
      await userApi.patch("/api/user/profile/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setEditingPassword(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      setPwError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 max-w-2xl">
        <Skeleton className="h-7 w-32" />
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal details and volunteer preferences.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Applications", value: profile._count?.opportunityApplications ?? 0 },
          { label: "Certificates", value: profile._count?.certificates ?? 0 },
          { label: "Ratings",      value: profile._count?.ratingsReceived ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Personal Info */}
      <Section title="Personal Information">
        {editingInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name"><input value={infoForm.name} onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })} className={inputCls} /></Field>
              <Field label="Phone"><input value={infoForm.phone} onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })} className={inputCls} /></Field>
              <Field label="City"><input value={infoForm.city} onChange={(e) => setInfoForm({ ...infoForm, city: e.target.value })} className={inputCls} /></Field>
              <Field label="Country"><input value={infoForm.country} onChange={(e) => setInfoForm({ ...infoForm, country: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Bio"><textarea value={infoForm.bio} onChange={(e) => setInfoForm({ ...infoForm, bio: e.target.value })} rows={3} className={`${inputCls} resize-none`} /></Field>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingInfo(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"><XMarkIcon className="h-4 w-4" /> Cancel</button>
              <button onClick={saveInfo} disabled={savingInfo} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer disabled:opacity-60"><CheckIcon className="h-4 w-4" /> {savingInfo ? "Saving..." : "Save"}</button>
            </div>
          </div>
        ) : (
          <div>
            {/* Replace the old avatar + info block */}
<div className="flex items-start justify-between mb-5">
  <div className="flex items-center gap-4">
    {/* Uploadable avatar */}
    <div className="relative group">
      <div className={`h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-700 overflow-hidden ${uploading ? "opacity-50" : ""}`}>
        {profile.baseProfile?.avatarUrl ? (
          <img
            src={getAvatarUrl(profile.baseProfile.avatarUrl)!}
            alt={profile.name}
            className="h-full w-full object-cover"
          />
        ) : (
          profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
            <svg className="h-5 w-5 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}
      </div>
      <button
        onClick={() => avatarInputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-0.5 -right-0.5 h-6 w-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        <CameraIcon className="h-3 w-3 text-gray-500" />
      </button>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleAvatarUpload}
      />
    </div>

    <div>
      <p className="text-base font-bold text-gray-900">{profile.name}</p>
      <p className="text-sm text-gray-500">{profile.email}</p>
      {profile.baseProfile?.avatarUrl && (
        <button
          onClick={handleRemoveAvatar}
          disabled={uploading}
          className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
        >
          <TrashIcon className="h-3 w-3" />
          Remove photo
        </button>
      )}
    </div>
  </div>

  <button onClick={() => setEditingInfo(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
    <PencilIcon className="h-3.5 w-3.5" /> Edit
  </button>
</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Phone",   value: profile.baseProfile?.phone },
                { label: "City",    value: profile.baseProfile?.city },
                { label: "Country", value: profile.baseProfile?.country },
                { label: "Joined",  value: new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-gray-700 mt-0.5">{value || "—"}</p>
                </div>
              ))}
            </div>
            {profile.baseProfile?.bio && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-1">Bio</p>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.baseProfile.bio}</p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Volunteer Preferences */}
      <Section title="Volunteer Info">
        {editingVolunteer ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="available"
                checked={volForm.isAvailable}
                onChange={(e) => setVolForm({ ...volForm, isAvailable: e.target.checked })}
                className="h-4 w-4 accent-violet-600"
              />
              <label htmlFor="available" className="text-sm font-medium text-gray-700">Available for volunteering</label>
            </div>
            <Field label="Available Days">
              <div className="flex flex-wrap gap-2 mt-1">
                {DAYS.map((day) => {
                  const active = volForm.availabilityDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setVolForm({ ...volForm, availabilityDays: active ? volForm.availabilityDays.filter((d) => d !== day) : [...volForm.availabilityDays, day] })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${active ? "bg-violet-600 text-white border-violet-600" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"}`}
                    >
                      {DAY_SHORT[day]}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Experience"><textarea value={volForm.experience} onChange={(e) => setVolForm({ ...volForm, experience: e.target.value })} rows={3} placeholder="Describe your volunteer experience..." className={`${inputCls} resize-none`} /></Field>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingVolunteer(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"><XMarkIcon className="h-4 w-4" /> Cancel</button>
              <button onClick={saveVolunteer} disabled={savingVol} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer disabled:opacity-60"><CheckIcon className="h-4 w-4" /> {savingVol ? "Saving..." : "Save"}</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${profile.volunteerProfile?.isAvailable ? "bg-emerald-500" : "bg-gray-400"}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {profile.volunteerProfile?.isAvailable ? "Available" : "Not available"}
                  </span>
                </div>
                {(profile.volunteerProfile?.availabilityDays?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.volunteerProfile!.availabilityDays.map((day) => (
                      <span key={day} className="px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 rounded-lg">
                        {DAY_SHORT[day]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setEditingVolunteer(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <PencilIcon className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
            {profile.volunteerProfile?.experience ? (
              <p className="text-sm text-gray-600 leading-relaxed">{profile.volunteerProfile.experience}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No experience added yet.</p>
            )}
          </div>
        )}
      </Section>

      {/* Skills */}
      <Section title="Skills">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 min-h-8">
            {skills.length === 0
              ? <p className="text-sm text-gray-400 italic">No skills added yet.</p>
              : skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full"
                >
                  {skill}
                  <button
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))
            }
          </div>
          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } }}
              placeholder="Add a skill (press Enter)"
              className={`flex-1 ${inputCls}`}
            />
            <button
              onClick={() => { if (newSkill.trim()) { setSkills([...skills, newSkill.trim()]); setNewSkill(""); } }}
              className="p-2.5 bg-violet-50 border border-violet-200 text-violet-600 rounded-xl hover:bg-violet-100 transition-colors cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={saveSkills}
            disabled={savingSkills}
            className="w-full py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {savingSkills ? "Saving..." : "Save Skills"}
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password">
        {editingPassword ? (
          <form onSubmit={savePassword} className="space-y-4">
            {pwError && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{pwError}</div>}
            <Field label="Current Password"><input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required className={inputCls} /></Field>
            <Field label="New Password"><input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required className={inputCls} /></Field>
            <Field label="Confirm New Password"><input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required className={inputCls} /></Field>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setEditingPassword(false); setPwError(""); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Cancel</button>
              <button type="submit" disabled={savingPw} className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer disabled:opacity-60">{savingPw ? "Saving..." : "Update Password"}</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setEditingPassword(true)} className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 cursor-pointer">
            <PencilIcon className="h-4 w-4" /> Change password
          </button>
        )}
      </Section>
    </div>
  );
}
