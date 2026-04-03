"use client";
import { useState, useEffect } from "react";
import { PencilSquareIcon, EnvelopeIcon, EyeIcon } from "@heroicons/react/24/outline";
import api from "@/lib/axios";

interface EmailTemplate {
  id: number;
  key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
  updatedAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/admin/settings/email-templates")
      .then((res) => setTemplates(res.data))
      .catch(() => setError("Failed to load email templates"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.put(`/api/admin/settings/email-templates/${editing.id}`, {
        subject: editing.subject,
        body: editing.body,
      });
      setTemplates((t) => t.map((tpl) => (tpl.id === editing.id ? res.data : tpl)));
      setEditing(null);
    } catch {
      setError("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Email Templates</h2>
        <p className="text-sm text-gray-500 mt-1">Customize the emails sent to users and NGOs.</p>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{tpl.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{tpl.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400">Edited {formatDate(tpl.updatedAt)}</span>
                <button onClick={() => setPreview(tpl)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer" title="Preview">
                  <EyeIcon className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button onClick={() => setEditing({ ...tpl })} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer" title="Edit">
                  <PencilSquareIcon className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Edit: {editing.name}</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Subject Line</label>
                <input type="text" value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Body</label>
                <textarea value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none font-mono leading-relaxed resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Available Variables</label>
                <div className="flex flex-wrap gap-1.5">
                  {editing.variables.map((v) => (
                    <span key={v} className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {"{{" + v + "}}"}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => setEditing(null)}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Preview: {preview.name}</h3>
              <button onClick={() => setPreview(null)} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">Close</button>
            </div>
            <div className="px-5 py-4">
              <div className="mb-3 pb-3 border-b border-gray-100">
                <p className="text-[11px] text-gray-400">Subject</p>
                <p className="text-sm text-gray-900 font-medium mt-0.5">{preview.subject}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{preview.body}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}