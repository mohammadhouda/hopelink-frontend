"use client";
import { useState, useEffect } from "react";
import { useCharity } from "@/context/CharityContext";
import charityApi from "@/lib/charityAxios";
import Dropdown, { DropdownOption } from "@/components/charity/Dropdown";

interface ProfileData {
  name: string;
  phone?: string;
  websiteUrl?: string;
  description?: string;
  city?: string;
  category?: string;
  logoUrl?: string;
  user?: {  email: string };
}

const CATEGORIES = [
  "EDUCATION", "HEALTH", "ENVIRONMENT", "ANIMAL_WELFARE", "SOCIAL", "OTHER",
];

export default function CharityProfilePage() {
  const { refreshCharity } = useCharity();
  const [form, setForm] = useState<ProfileData>({ name: "", user: { email: "" } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    charityApi.get("/api/charity/profile")
      .then((res) => setForm(res.data?.data || res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await charityApi.patch("/api/charity/profile", form);
      refreshCharity();
      setSuccess(true);
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your charity&apos;s public information.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="animate-pulse h-3 w-24 bg-gray-200 rounded" />
              <div className="animate-pulse h-10 w-full bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
            <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 overflow-hidden">
              {form.logoUrl ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${form.logoUrl}`}
                  alt={form.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                form.name?.slice(0, 2).toUpperCase() || "CH"
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{form.name || "Charity Name"}</p>
              <p className="text-xs text-gray-500">{form.user?.email}</p>
              {form.city && <p className="text-xs text-gray-400 mt-0.5">{form.city}</p>}
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 font-medium">
              <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Profile saved successfully.
            </div>
          )}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium">{error}</div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Organization Name" required>
              <input
                value={form.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="input"
                placeholder="Hope Builders"
              />
            </Field>
            <Field label="Email">
              <input
                value={form.user?.email || ""}
                disabled
                className="input opacity-50 cursor-not-allowed"
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="input"
                placeholder="+961 1 234 567"
              />
            </Field>
            <Field label="City">
              <input
                value={form.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                className="input"
                placeholder="Beirut"
              />
            </Field>
            <Field label="Website">
              <input
                value={form.websiteUrl || ""}
                onChange={(e) => handleChange("websiteUrl", e.target.value)}
                className="input"
                placeholder="https://example.org"
              />
            </Field>
            <Field label="Category">
              <Dropdown
                value={form.category || ""}
                onChange={(v) => handleChange("category", v)}
                options={[
                  { value: "", label: "Select category" },
                  ...CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") })),
                ]}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Describe your charity's mission and goals..."
            />
          </Field>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : "Save changes"}
            </button>
          </div>
        </form>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          outline: none;
          transition: all 0.15s;
        }
        .input:focus {
          background: #fff;
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(52,211,153,0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
