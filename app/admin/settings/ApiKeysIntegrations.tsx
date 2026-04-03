"use client";
import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  TrashIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";

interface ApiKey {
  id: number;
  name: string;
  key?: string;        // Only present on creation
  prefix: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

interface Integration {
  id: number;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected";
  connectedAt: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ApiKeysIntegrations() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchKeys = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/settings/api-keys");
      setKeys(res.data);
    } catch {
      console.error("Failed to load API keys");
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/settings/integrations");
      setIntegrations(res.data);
    } catch {
      console.error("Failed to load integrations");
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchIntegrations();
  }, [fetchKeys, fetchIntegrations]);

  function copyKey(id: number, key: string) {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteKey(id: number) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/settings/api-keys/${id}`);
      setKeys((k) => k.filter((key) => key.id !== id));
    } catch {
      setError("Failed to revoke API key");
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/api/admin/settings/api-keys", {
        name: newKeyName,
        permissions: ["read:projects"],
      });
      // Store the raw key — it's only returned once
      setNewlyCreatedKey(res.data.key);
      setNewlyCreatedId(res.data.id);
      setKeys((k) => [res.data, ...k]);
      setNewKeyName("");
      setShowNewModal(false);
    } catch {
      setError("Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function toggleIntegration(id: number) {
    try {
      const res = await api.patch(`/api/admin/settings/integrations/${id}/toggle`);
      setIntegrations((ints) => ints.map((i) => (i.id === id ? res.data : i)));
    } catch {
      setError("Failed to toggle integration");
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* ── Newly created key warning ── */}
      {newlyCreatedKey && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800 mb-1">Copy your API key now — it won&apos;t be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-amber-900 bg-amber-100 px-2 py-1 rounded font-mono flex-1 break-all">
              {newlyCreatedKey}
            </code>
            <button onClick={() => { copyKey(newlyCreatedId!, newlyCreatedKey); }}
              className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 cursor-pointer">
              {copied === newlyCreatedId ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => { setNewlyCreatedKey(null); setNewlyCreatedId(null); }}
            className="text-[11px] text-amber-600 hover:text-amber-700 mt-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ── API Keys ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">API Keys</h2>
            <p className="text-sm text-gray-500 mt-1">Manage keys for external access to the platform API.</p>
          </div>
          <button onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer">
            <PlusIcon className="h-3.5 w-3.5" /> Generate Key
          </button>
        </div>

        {loadingKeys ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="h-28 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">No API keys created yet.</div>
        ) : (
          <div className="space-y-2">
            {keys.map((apiKey) => (
              <div key={apiKey.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mt-0.5">
                      <KeyIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{apiKey.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-mono">
                          {apiKey.prefix}{"•".repeat(20)}
                        </code>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-gray-400">Created {formatDate(apiKey.createdAt)}</span>
                        <span className="text-[11px] text-gray-400">Last used {formatDate(apiKey.lastUsedAt)}</span>
                        {apiKey.expiresAt && (
                          <span className="text-[11px] text-amber-500">Expires {formatDate(apiKey.expiresAt)}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {apiKey.permissions.map((p) => (
                          <span key={p} className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteKey(apiKey.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer">
                    <TrashIcon className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Integrations ── */}
      {/* <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500 mt-1">Connect third-party services to the platform.</p>
        </div>

        {loadingIntegrations ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {integrations.map((int) => (
              <div key={int.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-lg">
                      {int.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{int.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">{int.description}</p>
                      {int.connectedAt && (
                        <p className="text-[10px] text-gray-300 mt-1">Connected {formatDate(int.connectedAt)}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => toggleIntegration(int.id)}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      int.status === "connected"
                        ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                        : "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                    }`}>
                    {int.status === "connected" ? "Disconnect" : "Connect"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div> */}

      {/* New key modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Generate API Key</h3>
            </div>
            <div className="px-5 py-4">
              <label className="text-[11px] font-medium text-gray-500 block mb-1">Key Name</label>
              <input type="text" value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-100 outline-none"
                placeholder="e.g. Mobile App, CI/CD Pipeline"
                autoFocus />
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button onClick={() => { setShowNewModal(false); setNewKeyName(""); }}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={createKey} disabled={!newKeyName.trim() || creating}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                {creating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}