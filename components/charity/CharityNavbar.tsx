"use client";
import { useState, useRef, useEffect } from "react";
import { useCharity } from "@/context/CharityContext";
import { getAvatarUrl } from "@/lib/avatarUrl";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import NotificationBell from "@/components/ui/NotificationBell";

export default function CharityNavbar() {
  const { charity, loading } = useCharity();
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

  const handleLogout = async () => {
    try { await charityApi.post("/api/auth/logout"); } catch { /* silent */ }
    router.replace("/charity/login");
  };

  const initials = charity?.name
    ? charity.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "CH";

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex justify-between items-center sticky top-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center" />
        <div>
          <span className="text-sm font-bold text-gray-900 leading-tight block">Hope Link</span>
          <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide leading-tight block">
            Charity Portal
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-emerald-500 animate-spin" />
        ) : (
          <>
            <NotificationBell
              apiClient={charityApi}
              basePath="/api/charity/notifications"
              viewAllPath="/charity/notifications"
              theme="emerald"
              onOpen={() => setDropdownOpen(false)}
            />

            <div className="h-8 w-px bg-gray-200 mx-1" />

            {/* Charity dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center text-sm font-semibold text-emerald-700">
                  {charity?.logoUrl ? (
                    <img
                      src={getAvatarUrl(charity.logoUrl)!}
                      alt={charity?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : initials}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight">
                    {charity?.name || "Charity"}
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">{charity?.email || ""}</span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5">
                  <div className="px-4 py-2.5 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{charity?.name || "Charity"}</p>
                    <p className="text-xs text-gray-500 truncate">{charity?.email}</p>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/charity/profile"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <UserCircleIcon className="h-4 w-4 text-gray-400" /> Profile
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
