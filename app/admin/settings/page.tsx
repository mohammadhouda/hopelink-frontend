"use client";
import { useState } from "react";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import PlatformSettings from "./PlatformSettings";
import RolesPermissions from "./RolesPermissions";
import SecuritySettings from "./SecuritySettings";
import EmailTemplates from "./EmailTemplates";
import AuditLog from "./AuditLog";
import ApiKeysIntegrations from "./ApiKeysIntegrations";

type SectionKey = "platform" | "roles" | "security" | "emails" | "audit" | "api";

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType; description: string }[] = [
  { key: "platform", label: "Platform", icon: Cog6ToothIcon, description: "Site identity & defaults" },
  { key: "roles", label: "Roles & Permissions", icon: ShieldCheckIcon, description: "Access control" },
  { key: "security", label: "Security", icon: LockClosedIcon, description: "2FA, sessions & logins" },
  { key: "emails", label: "Email Templates", icon: EnvelopeIcon, description: "Notification emails" },
  { key: "audit", label: "Audit Log", icon: ClipboardDocumentListIcon, description: "Admin activity" },
  { key: "api", label: "API & Integrations", icon: KeyIcon, description: "Keys & third-party" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("platform");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your platform configuration and preferences.</p>
      </div>

      <div className="flex gap-5 min-h-[calc(100vh-180px)]">
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-0.5">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.key;
              return (
                <button key={section.key} onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isActive ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50 border border-transparent"
                  }`}>
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>{section.label}</p>
                    <p className={`text-[11px] mt-0.5 ${isActive ? "text-blue-500" : "text-gray-400"}`}>{section.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
          {activeSection === "platform" && <PlatformSettings />}
          {activeSection === "roles" && <RolesPermissions />}
          {activeSection === "security" && <SecuritySettings />}
          {activeSection === "emails" && <EmailTemplates />}
          {activeSection === "audit" && <AuditLog />}
          {activeSection === "api" && <ApiKeysIntegrations />}
        </div>
      </div>
    </div>
  );
}