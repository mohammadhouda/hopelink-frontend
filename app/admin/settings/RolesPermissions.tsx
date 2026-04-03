"use client";
import { useState, useEffect, useCallback } from "react";
import { PencilSquareIcon, TrashIcon, PlusIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import api from "@/lib/axios";

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
}

const ALL_PERMISSIONS = [
  "manage_users", "manage_ngos", "manage_projects", "manage_requests",
  "view_reports", "export_data", "manage_settings", "manage_roles",
];

const PERMISSION_LABELS: Record<string, string> = {
  manage_users: "Manage Users",
  manage_ngos: "Manage NGOs",
  manage_projects: "Manage Projects",
  manage_requests: "Manage Requests",
  view_reports: "View Reports",
  export_data: "Export Data",
  manage_settings: "Manage Settings",
  manage_roles: "Manage Roles",
};

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRoles = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/settings/roles");
      setRoles(res.data);
    } catch {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  function openNew() {
    setEditing({ id: 0, name: "", description: "", permissions: [], isSystem: false });
    setShowModal(true);
    setError("");
  }

  function openEdit(role: Role) {
    setEditing({ ...role });
    setShowModal(true);
    setError("");
  }

  function togglePermission(perm: string) {
    if (!editing) return;
    setEditing((e) =>
      e ? {
        ...e,
        permissions: e.permissions.includes(perm)
          ? e.permissions.filter((p) => p !== perm)
          : [...e.permissions, perm],
      } : null
    );
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      if (editing.id) {
        await api.put(`/api/admin/settings/roles/${editing.id}`, {
          name: editing.name,
          description: editing.description,
          permissions: editing.permissions,
        });
      } else {
        await api.post("/api/admin/settings/roles", {
          name: editing.name,
          description: editing.description,
          permissions: editing.permissions,
        });
      }
      setShowModal(false);
      setEditing(null);
      await fetchRoles();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this role?")) return;
    try {
      await api.delete(`/api/admin/settings/roles/${id}`);
      await fetchRoles();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete role");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-50 rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">Define who can do what on the platform.</p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer">
          <PlusIcon className="h-3.5 w-3.5" /> New Role
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mt-0.5">
                  <ShieldCheckIcon className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{role.name}</h3>
                    {role.isSystem && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">System</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {role.permissions.map((p) => (
                      <span key={p} className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {PERMISSION_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(role)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
                  <PencilSquareIcon className="h-3.5 w-3.5 text-gray-400" />
                </button>
                {!role.isSystem && (
                  <button onClick={() => handleDelete(role.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer">
                    <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">{editing.id ? "Edit Role" : "Create Role"}</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Role Name</label>
                <input type="text" value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none"
                  placeholder="e.g. Content Moderator" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1">Description</label>
                <input type="text" value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none"
                  placeholder="Brief role description" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = editing.permissions.includes(perm);
                    return (
                      <button key={perm} type="button" onClick={() => togglePermission(perm)}
                        className={`flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg border transition-colors cursor-pointer text-left ${
                          checked ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}>
                        <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                          checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                        }`}>
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </span>
                        {PERMISSION_LABELS[perm]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => { setShowModal(false); setEditing(null); }}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!editing.name.trim() || saving}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                {saving ? "Saving..." : editing.id ? "Save Changes" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}