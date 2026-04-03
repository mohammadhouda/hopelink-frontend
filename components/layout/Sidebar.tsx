"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  InboxStackIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  UsersIcon as UsersIconSolid,
  InboxStackIcon as InboxStackIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from "@heroicons/react/24/solid";
import api from "@/lib/axios";

export default function Sidebar() {
  const pathname: string = usePathname();
  const router = useRouter();

  const menuItems: {
    label: string;
    href: string;
    icon: React.ElementType;
    activeIcon: React.ElementType;
  }[] = [
    { label: "Home", href: "/admin/dashboard", icon: HomeIcon, activeIcon: HomeIconSolid },
    { label: "NGOs", href: "/admin/ngo", icon: BuildingOfficeIcon, activeIcon: BuildingOfficeIconSolid },
    { label: "Users", href: "/admin/users", icon: UsersIcon, activeIcon: UsersIconSolid },
    { label: "Requests", href: "/admin/requests", icon: InboxStackIcon, activeIcon: InboxStackIconSolid },
    { label: "Reports", href: "/admin/reports", icon: ChartBarIcon, activeIcon: ChartBarIconSolid },
    { label: "Settings", href: "/admin/settings", icon: Cog6ToothIcon, activeIcon: Cog6ToothIconSolid },
  ];

  const handleLogout = async () => {
    try {
      // calling the logout API endpoint to clear the session cookie
      await api.post("/api/auth/logout");
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      router.replace("/login");
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between overflow-y-auto">
      <nav className="flex flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 ease-in-out
                ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium
            text-red-600 hover:bg-red-50 transition-all duration-150 ease-in-out cursor-pointer
          "
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}