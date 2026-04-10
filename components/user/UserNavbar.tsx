"use client";
import { useState, useRef, useEffect } from "react";
import { useVolunteer } from "@/context/VolunteerContext";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import NotificationBell from "@/components/ui/NotificationBell";

interface UserNavbarProps {
  onMenuToggle?: () => void;
}

export default function UserNavbar({ onMenuToggle }: UserNavbarProps) {
  const { volunteer, loading } = useVolunteer();
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
    try { await userApi.post("/api/auth/logout"); } catch { /* silent */ }
    router.replace("/user/login");
  };

  const initials = volunteer?.name
    ? volunteer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "VL";

  const avatarUrl = volunteer?.baseProfile?.avatarUrl;

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5 flex justify-between items-center sticky top-0 z-20">
      {/* Left — hamburger (mobile) + brand */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Bars3Icon className="h-5 w-5 text-gray-500" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center" />
          <div>
            <span className="text-sm font-bold text-gray-900 leading-tight block">Hope Link</span>
            <span className="text-[10px] text-violet-600 font-medium uppercase tracking-wide leading-tight block">
              Volunteer Portal
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-violet-500 animate-spin" />
        ) : (
          <>
            <NotificationBell
              apiClient={userApi}
              basePath="/api/user/notifications"
              viewAllPath="/user/notifications"
              theme="violet"
              onOpen={() => setDropdownOpen(false)}
            />

            <div className="h-8 w-px bg-gray-200 mx-1" />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-violet-100 overflow-hidden flex items-center justify-center text-sm font-semibold text-violet-700">
                  {avatarUrl ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`}
                      alt={volunteer?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : initials}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight">
                    {volunteer?.name || "Volunteer"}
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">{volunteer?.email || ""}</span>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-medium text-gray-900">{volunteer?.name || "Volunteer"}</p>
                    <p className="text-xs text-gray-500 truncate">{volunteer?.email}</p>
                  </div>
                  <button
                    onClick={() => { setDropdownOpen(false); router.push("/user/profile"); }}
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
