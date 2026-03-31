"use client";
import { useState, useEffect } from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import api from "@/lib/axios";
import CustomDropdown from "@/components/CustomDropdown";

const LANGUAGES = [
  { label: "English", value: "en" },
];

interface PlatformData {
  siteName: string;
  tagline: string;
  defaultLanguage: string;
  logoUrl: string;
  supportEmail: string;
  maxUploadSizeMb: number;
  maintenanceMode: boolean;
}

const INITIAL: PlatformData = {
  siteName: "",
  tagline: "",
  defaultLanguage: "en",
  logoUrl: "",
  supportEmail: "",
  maxUploadSizeMb: 10,
  maintenanceMode: false,
};

export default function PlatformSettings() {
  const [form, setForm] = useState<PlatformData>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/admin/settings/platform")
      .then((res) => setForm({ ...INITIAL, ...res.data }))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof PlatformData>(key: K, value: PlatformData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await api.put("/api/admin/settings/platform", form);
      setForm({ ...INITIAL, ...res.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div><div className="h-6 w-48 bg-gray-100 rounded animate-pulse" /><div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-2" /></div>
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Platform Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your platform&apos;s identity and defaults.</p>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Logo */}
      <div className="flex items-start gap-5 pb-5 border-b border-gray-100">
        <div className="w-44 flex-shrink-0">
          <p className="text-sm font-medium text-gray-700">Logo</p>
          <p className="text-xs text-gray-400 mt-0.5">Displayed in the sidebar and emails.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
            ) : (
              <PhotoIcon className="h-6 w-6 text-gray-300" />
            )}
          </div>
          <div>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              Upload new logo
            </button>
            <p className="text-[11px] text-gray-400 mt-0.5">PNG, SVG up to 2MB</p>
          </div>
        </div>
      </div>

      {/* Site name & tagline */}
      <div className="flex items-start gap-5 pb-5 border-b border-gray-100">
        <div className="w-44 flex-shrink-0">
          <p className="text-sm font-medium text-gray-700">Site Identity</p>
          <p className="text-xs text-gray-400 mt-0.5">Name and tagline shown across the platform.</p>
        </div>
        <div className="flex-1 space-y-3 max-w-md">
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Site Name</label>
            <input type="text" value={form.siteName} onChange={(e) => update("siteName", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Tagline</label>
            <input type="text" value={form.tagline} onChange={(e) => update("tagline", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
        </div>
      </div>

      {/* Language & support email */}
      <div className="flex items-start gap-5 pb-5 border-b border-gray-100">
        <div className="w-44 flex-shrink-0">
          <p className="text-sm font-medium text-gray-700">Defaults</p>
          <p className="text-xs text-gray-400 mt-0.5">Language and contact info.</p>
        </div>
        <div className="flex-1 space-y-3 max-w-md">
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Default Language</label>
            <CustomDropdown options={LANGUAGES} value={form.defaultLanguage} onChange={(val) => update("defaultLanguage", val)} />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Support Email</label>
            <input type="email" value={form.supportEmail} onChange={(e) => update("supportEmail", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
        </div>
      </div>

      {/* Upload limit & maintenance */}
      <div className="flex items-start gap-5 pb-5 border-b border-gray-100">
        <div className="w-44 flex-shrink-0">
          <p className="text-sm font-medium text-gray-700">Advanced</p>
          <p className="text-xs text-gray-400 mt-0.5">Upload limits and maintenance mode.</p>
        </div>
        <div className="flex-1 space-y-3 max-w-md">
          <div>
            <label className="text-[11px] font-medium text-gray-500 block mb-1">Max Upload Size (MB)</label>
            <input type="number" value={form.maxUploadSizeMb} min={1} max={100}
              onChange={(e) => update("maxUploadSizeMb", Number(e.target.value))}
              className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Maintenance Mode</p>
              <p className="text-xs text-gray-400">Temporarily disable public access.</p>
            </div>
            <button onClick={() => update("maintenanceMode", !form.maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.maintenanceMode ? "bg-blue-600" : "bg-gray-200"}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-xs text-emerald-600 font-medium">Saved successfully!</span>}
      </div>
    </div>
  );
}