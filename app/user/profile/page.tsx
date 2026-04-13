"use client";
import { useState, useEffect, useRef } from "react";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CameraIcon,
  BriefcaseIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
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
const CATEGORIES = ["EDUCATION", "HEALTH", "ENVIRONMENT", "ANIMAL_WELFARE", "SOCIAL", "OTHER"] as const;
const CITIES: { value: string; label: string }[] = [
  { value: "",         label: "—" },
  { value: "BEIRUT",   label: "Beirut" },
  { value: "TRIPOLI",  label: "Tripoli" },
  { value: "SIDON",    label: "Sidon" },
  { value: "TYRE",     label: "Tyre" },
  { value: "JOUNIEH",  label: "Jounieh" },
  { value: "BYBLOS",   label: "Byblos" },
  { value: "ZAHLE",    label: "Zahle" },
  { value: "BAALBEK",  label: "Baalbek" },
  { value: "NABATIEH", label: "Nabatieh" },
  { value: "ALEY",     label: "Aley" },
  { value: "CHOUF",    label: "Chouf" },
  { value: "METN",     label: "Metn" },
  { value: "KESREWAN", label: "Kesrewan" },
  { value: "AKKAR",    label: "Akkar" },
  { value: "OTHER",    label: "Other" },
];
const CAT_LABEL: Record<string, string> = { EDUCATION: "Education", HEALTH: "Health", ENVIRONMENT: "Environment", ANIMAL_WELFARE: "Animal Welfare", SOCIAL: "Social", OTHER: "Other" };

interface VolunteerExperience {
  id: number;
  company: string;
  role: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
}

const EMPTY_EXP = { company: "", role: "", startDate: "", endDate: "", isCurrent: false, description: "" };

function fmtMonth(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

interface Rating {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  charity: { id: number; name: string };
  opportunity: { id: number; title: string };
}

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) =>
        i < Math.round(value)
          ? <StarIconSolid key={i} className="h-3.5 w-3.5 text-amber-400" />
          : <StarIcon key={i} className="h-3.5 w-3.5 text-gray-200" />
      )}
    </div>
  );
}

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

  // Experience history
  const [experiences, setExperiences] = useState<VolunteerExperience[]>([]);
  const [showExpForm, setShowExpForm] = useState(false);
  const [editingExp, setEditingExp] = useState<VolunteerExperience | null>(null);
  const [expForm, setExpForm] = useState({ ...EMPTY_EXP });
  const [savingExp, setSavingExp] = useState(false);

  // Volunteering preferences
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefForm, setPrefForm] = useState({ city: "", category: "" });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Ratings received
  const [ratings, setRatings] = useState<Rating[]>([]);

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
        const prefs: { type: string; value: string }[] = p?.volunteerProfile?.preferences || [];
        setPrefForm({
          city: prefs.find((pr) => pr.type === "CITY")?.value ?? "",
          category: prefs.find((pr) => pr.type === "CATEGORY")?.value ?? "",
        });
      })
      .finally(() => setLoading(false));
  };

  const fetchExperiences = () => {
    userApi.get("/api/user/profile/experiences")
      .then((res) => setExperiences(res.data?.data || []))
      .catch(() => {});
  };

  const fetchRatings = () => {
    userApi.get("/api/user/profile/ratings")
      .then((res) => setRatings(res.data?.data?.ratings || []))
      .catch(() => {});
  };

  useEffect(() => { fetchProfile(); fetchExperiences(); fetchRatings(); }, []);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(file.type)) return;
  if (file.size > 2 * 1024 * 1024) return;

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await userApi.post("/api/upload/single?bucket=logos&folder=profile", formData, {
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

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      const preferences = [
        prefForm.city.trim() ? { type: "CITY", value: prefForm.city.trim() } : null,
        prefForm.category ? { type: "CATEGORY", value: prefForm.category } : null,
      ].filter(Boolean);
      await userApi.patch("/api/user/profile/preferences", { preferences });
      setEditingPrefs(false);
      fetchProfile();
    } finally {
      setSavingPrefs(false);
    }
  };

  const openAddExp = () => { setEditingExp(null); setExpForm({ ...EMPTY_EXP }); setShowExpForm(true); };
  const openEditExp = (exp: VolunteerExperience) => {
    setEditingExp(exp);
    setExpForm({
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate?.slice(0, 7) ?? "",
      endDate: exp.endDate?.slice(0, 7) ?? "",
      isCurrent: exp.isCurrent,
      description: exp.description ?? "",
    });
    setShowExpForm(true);
  };
  const cancelExp = () => { setShowExpForm(false); setEditingExp(null); setExpForm({ ...EMPTY_EXP }); };

  const saveExp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingExp(true);
    try {
      const payload = {
        ...expForm,
        startDate: expForm.startDate ? `${expForm.startDate}-01` : "",
        endDate: expForm.isCurrent ? null : (expForm.endDate ? `${expForm.endDate}-01` : null),
      };
      if (editingExp) {
        await userApi.put(`/api/user/profile/experiences/${editingExp.id}`, payload);
      } else {
        await userApi.post("/api/user/profile/experiences", payload);
      }
      cancelExp();
      fetchExperiences();
    } finally {
      setSavingExp(false);
    }
  };

  const deleteExp = async (id: number) => {
    if (!confirm("Remove this experience?")) return;
    await userApi.delete(`/api/user/profile/experiences/${id}`);
    fetchExperiences();
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
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :root {
          --font-heading: 'Inter', sans-serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>
      <div className="space-y-5 max-w-2xl" style={{ fontFamily: "var(--font-body)" }}>
        <header style={{ animation: "fadeUp 0.35s ease both" }}>
          <h1
            style={{
              fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.03em",
            }}
          >
            My Profile
          </h1>
          <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: "4px 0 0" }}>
            Manage your personal details and volunteer preferences.
          </p>
        </header>

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
              <Field label="City">
                <select value={infoForm.city} onChange={(e) => setInfoForm({ ...infoForm, city: e.target.value })} className={inputCls}>
                  {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
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

      {/* Volunteering Preferences */}
      <Section title="Volunteering Preferences">
        {editingPrefs ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Preferred City</label>
              <select value={prefForm.city} onChange={(e) => setPrefForm({ ...prefForm, city: e.target.value })} className={inputCls}>
                {CITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Preferred Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const active = prefForm.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPrefForm({ ...prefForm, category: active ? "" : cat })}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        active
                          ? "bg-violet-600 text-white border-violet-600"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                      }`}
                    >
                      {CAT_LABEL[cat]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingPrefs(false)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                <XMarkIcon className="h-4 w-4" /> Cancel
              </button>
              <button onClick={savePreferences} disabled={savingPrefs} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer disabled:opacity-60">
                <CheckIcon className="h-4 w-4" /> {savingPrefs ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              {!prefForm.city && !prefForm.category ? (
                <p className="text-sm text-gray-400 italic">No preferences set yet.</p>
              ) : (
                <>
                  {prefForm.city && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 shrink-0">City</span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                        {prefForm.city}
                      </span>
                    </div>
                  )}
                  {prefForm.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 shrink-0">Focus</span>
                      <span className="px-2.5 py-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-full">
                        {CAT_LABEL[prefForm.category] ?? prefForm.category}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <button onClick={() => setEditingPrefs(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer shrink-0">
              <PencilIcon className="h-3.5 w-3.5" /> Edit
            </button>
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

      {/* Experience History */}
      <Section title="Experience History">
        <div className="space-y-4">
          {/* Existing entries */}
          {experiences.length > 0 && (
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="flex items-start gap-3 group">
                  <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                    <BriefcaseIcon className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{exp.role}</p>
                        <p className="text-xs text-gray-500">{exp.company}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtMonth(exp.startDate)} — {exp.isCurrent ? "Present" : fmtMonth(exp.endDate)}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEditExp(exp)} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer">
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteExp(exp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit form */}
          {showExpForm ? (
            <form onSubmit={saveExp} className="border border-violet-100 rounded-xl p-4 space-y-3 bg-violet-50/30">
              <p className="text-xs font-semibold text-gray-700">{editingExp ? "Edit Experience" : "Add Experience"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Organization</label>
                  <input required value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} className={inputCls} placeholder="e.g. Beit El Baraka" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Role / Position</label>
                  <input required value={expForm.role} onChange={(e) => setExpForm({ ...expForm, role: e.target.value })} className={inputCls} placeholder="e.g. Volunteer Coordinator" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Start Date</label>
                  <input required type="month" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">End Date</label>
                  <input type="month" disabled={expForm.isCurrent} value={expForm.isCurrent ? "" : expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} className={`${inputCls} ${expForm.isCurrent ? "opacity-40" : ""}`} />
                  <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
                    <input type="checkbox" checked={expForm.isCurrent} onChange={(e) => setExpForm({ ...expForm, isCurrent: e.target.checked, endDate: "" })} className="rounded" />
                    <span className="text-xs text-gray-500">Currently working here</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Description (optional)</label>
                  <textarea rows={2} value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} className={`${inputCls} resize-none`} placeholder="Briefly describe your role…" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={cancelExp} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={savingExp} className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl cursor-pointer disabled:opacity-60">
                  {savingExp ? "Saving…" : editingExp ? "Update" : "Add"}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={openAddExp} className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors cursor-pointer">
              <PlusIcon className="h-4 w-4" />
              Add experience
            </button>
          )}
        </div>
      </Section>

      {/* Ratings Received */}
      <Section title="Ratings Received">
        {ratings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No ratings received yet.</p>
        ) : (
          <div className="space-y-1">
            {/* Average */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              <span className="text-3xl font-bold text-gray-900">
                {(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)}
              </span>
              <div>
                <StarDisplay value={ratings.reduce((s, r) => s + r.rating, 0) / ratings.length} />
                <p className="text-xs text-gray-400 mt-0.5">{ratings.length} {ratings.length === 1 ? "rating" : "ratings"}</p>
              </div>
            </div>
            {/* Individual ratings */}
            <div className="space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <StarIconSolid className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <StarDisplay value={r.rating} />
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">{r.charity.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.opportunity.title}</p>
                    {r.comment && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 italic">&ldquo;{r.comment}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
    </>
  );
}
