"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  MagnifyingGlassIcon as SearchIconSolid,
  ClipboardDocumentListIcon as ClipboardIconSolid,
  ChatBubbleLeftRightIcon as ChatIconSolid,
  DocumentCheckIcon as DocumentCheckIconSolid,
  BellIcon as BellIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  NewspaperIcon as NewspaperIconSolid,
} from "@heroicons/react/24/solid";
import userApi from "@/lib/userAxios";

const menuItems = [
  { label: "Dashboard",       href: "/user/dashboard",         icon: HomeIcon,                  activeIcon: HomeIconSolid },
  { label: "Opportunities",   href: "/user/opportunities",     icon: MagnifyingGlassIcon,       activeIcon: SearchIconSolid },
  { label: "Feed",            href: "/user/feed",              icon: NewspaperIcon,             activeIcon: NewspaperIconSolid },
  { label: "Applications",    href: "/user/applications",      icon: ClipboardDocumentListIcon, activeIcon: ClipboardIconSolid },
  { label: "Chat Rooms",      href: "/user/rooms",             icon: ChatBubbleLeftRightIcon,   activeIcon: ChatIconSolid },
  { label: "Certificates",    href: "/user/certificates",      icon: DocumentCheckIcon,         activeIcon: DocumentCheckIconSolid },
  { label: "Notifications",   href: "/user/notifications",     icon: BellIcon,                  activeIcon: BellIconSolid },
  { label: "Profile",         href: "/user/profile",           icon: UserCircleIcon,            activeIcon: UserCircleIconSolid },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try { await userApi.post("/api/auth/logout"); } catch { /* silent */ }
    router.replace("/user/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between overflow-y-auto shrink-0">
      <nav className="flex flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = isActive ? item.activeIcon : item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-violet-700" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150 cursor-pointer"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
