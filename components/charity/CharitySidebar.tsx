"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  FolderIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  FolderIcon as FolderIconSolid,
  CalendarIcon as CalendarIconSolid,
  ClipboardDocumentListIcon as ClipboardIconSolid,
  StarIcon as StarIconSolid,
  DocumentCheckIcon as DocumentCheckIconSolid,
  ChatBubbleLeftRightIcon as ChatIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from "@heroicons/react/24/solid";
import charityApi from "@/lib/charityAxios";

const menuItems = [
  { label: "Dashboard", href: "/charity/dashboard", icon: HomeIcon, activeIcon: HomeIconSolid },
  { label: "Projects", href: "/charity/projects", icon: FolderIcon, activeIcon: FolderIconSolid },
  { label: "Opportunities", href: "/charity/opportunities", icon: CalendarIcon, activeIcon: CalendarIconSolid },
  { label: "Applications", href: "/charity/applications", icon: ClipboardDocumentListIcon, activeIcon: ClipboardIconSolid },
  { label: "Ratings", href: "/charity/ratings", icon: StarIcon, activeIcon: StarIconSolid },
  { label: "Certificates", href: "/charity/certificates", icon: DocumentCheckIcon, activeIcon: DocumentCheckIconSolid },
  { label: "Chat Rooms", href: "/charity/rooms", icon: ChatBubbleLeftRightIcon, activeIcon: ChatIconSolid },
  { label: "Profile", href: "/charity/profile", icon: UserCircleIcon, activeIcon: UserCircleIconSolid },
];

export default function CharitySidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await charityApi.post("/api/auth/logout");
    } catch {
      // silent
    }
    router.replace("/charity/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between overflow-y-auto">
      <nav className="flex flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? "text-emerald-700" : "text-gray-400"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-150 ease-in-out cursor-pointer"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
