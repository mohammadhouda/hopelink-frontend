"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function getDashboardLink(pathname: string): { href: string; label: string } {
  if (pathname.startsWith("/admin")) {
    return { href: "/admin/dashboard", label: "Admin Dashboard" };
  }
  if (pathname.startsWith("/charity")) {
    return { href: "/charity/dashboard", label: "Charity Dashboard" };
  }
  if (pathname.startsWith("/user")) {
    return { href: "/user/dashboard", label: "My Dashboard" };
  }
  return { href: "/", label: "Home" };
}

export default function NotFound() {
  const pathname = usePathname();
  const { href, label } = getDashboardLink(pathname);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found</p>
      <p className="mt-2 text-sm text-gray-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href={href}
        className="mt-8 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
      >
        Back to {label}
      </Link>
    </div>
  );
}
