"use client";
import { useState } from "react";
import { VolunteerProvider } from "@/context/VolunteerContext";
import ProtectedUserRoute from "@/components/user/ProtectedUserRoute";
import UserSidebar from "@/components/user/UserSidebar";
import UserNavbar from "@/components/user/UserNavbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <VolunteerProvider>
      <ProtectedUserRoute>
        <div className="flex flex-col h-screen overflow-hidden">
          <UserNavbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
          <div className="flex flex-1 overflow-hidden relative">
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-30 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar — always visible on md+, slide-in on mobile */}
            <div
              className={`
                fixed md:static inset-y-0 left-0 z-40 md:z-auto
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
              `}
            >
              <UserSidebar />
            </div>

            <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedUserRoute>
    </VolunteerProvider>
  );
}
