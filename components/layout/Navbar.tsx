'use client';
import { useState, useRef, useEffect } from "react";
import Logo from "@/components/logo";
import { getAvatarUrl } from "@/lib/avatarUrl";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/axios";
import NotificationBell from "@/components/ui/NotificationBell";

export default function Navbar() {
  const { user, loading } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => router.replace("/login");

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center">
        <Logo className="w-50 h-12.5" />
      </div>

      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
        ) : (
          <>
            <NotificationBell
              apiClient={api}
              basePath="/api/admin/notifications"
              viewAllPath="/admin/notifications"
              theme="blue"
              onOpen={() => setDropdownOpen(false)}
            />

            <div className="h-8 w-px bg-gray-200 mx-1" />

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center text-sm font-medium text-gray-600">
                  {user?.avatarUrl ? (
                    <img
                      src={getAvatarUrl(user.avatarUrl)!}
                      alt={user?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : initials}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight">{user?.name || "Admin"}</span>
                  <span className="text-xs text-gray-500 leading-tight">{user?.email || ""}</span>
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5">
                  <div className="px-4 py-2.5 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{user?.name || "Admin"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/profile"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <UserCircleIcon className="h-4 w-4 text-gray-400" /> Profile
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/admin/settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Cog6ToothIcon className="h-4 w-4 text-gray-400" /> Settings
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
