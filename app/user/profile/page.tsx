"use client";
import { useState, useEffect } from "react";
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useVolunteer } from "@/context/VolunteerContext";
import userApi from "@/lib/userAxios";

interface Profile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  baseProfile?: { phone?: string; city?: string; country?: string; bio?: string; avatarUrl?: string } | null;
  volunteerProfile?: {
    isAvailable: boolean;
    availabilityNote?: string;
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

export default function ProfilePage() {
  const { refreshVolunteer } = useVolunteer();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", phone: "", city: "", country: "", bio: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingVolunteer, setEditingVolunteer] = useState(false);
  const [volForm, setVolForm] = useState({ isAvailable: true, availabilityNote: "", experience: "" });
  const [savingVol, setSavingVol] = useState(false);

  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

  // Password
  const [editingPassword, setEditingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

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
          availabilityNote: p?.volunteerProfile?.availabilityNote || "",
          experience: p?.volunteerProfile?.experience || "",
        });
        setSkills((p?.volunteerProfile?.skills || []).map((s: { skill: string }) => s.skill));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

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

  const savePassword = async (e: React.FormEvent) => {
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
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-violet-100 flex items-center justify-center text-lg font-bold text-violet-700">
                  {profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{profile.name}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
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
            <Field label="Availability Note"><input value={volForm.availabilityNote} onChange={(e) => setVolForm({ ...volForm, availabilityNote: e.target.value })} placeholder="e.g., Weekends only" className={inputCls} /></Field>
            <Field label="Experience"><textarea value={volForm.experience} onChange={(e) => setVolForm({ ...volForm, experience: e.target.value })} rows={3} placeholder="Describe your volunteer experience..." className={`${inputCls} resize-none`} /></Field>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingVolunteer(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"><XMarkIcon className="h-4 w-4" /> Cancel</button>
              <button onClick={saveVolunteer} disabled={savingVol} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer disabled:opacity-60"><CheckIcon className="h-4 w-4" /> {savingVol ? "Saving..." : "Save"}</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${profile.volunteerProfile?.isAvailable ? "bg-emerald-500" : "bg-gray-400"}`} />
                <span className="text-sm font-medium text-gray-700">
                  {profile.volunteerProfile?.isAvailable ? "Available" : "Not available"}
                </span>
                {profile.volunteerProfile?.availabilityNote && (
                  <span className="text-xs text-gray-400">— {profile.volunteerProfile.availabilityNote}</span>
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
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
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
