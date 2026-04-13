"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useVolunteer } from "@/context/VolunteerContext";
import userApi from "@/lib/userAxios";

interface RecentApplication {
  id: number;
  status: string;
  createdAt: string;
  opportunity: {
    id: number;
    title: string;
    charity: { name: string; logoUrl?: string };
  };
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border-red-200",
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function UserDashboardPage() {
  const { volunteer } = useVolunteer();
  const router = useRouter();
  const [recentApps, setRecentApps] = useState<RecentApplication[]>([]);
  const [totalApps, setTotalApps] = useState(0);
  const [totalCerts, setTotalCerts] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [openOpps, setOpenOpps] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.get("/api/user/applications?limit=5"),
      userApi.get("/api/user/certificates?limit=1"),
      userApi.get("/api/user/rooms"),
      userApi.get("/api/user/opportunities?limit=1"),
    ]).then(([appsRes, certsRes, roomsRes, oppsRes]) => {
      const apps = appsRes.data?.data;
      setRecentApps(apps?.applications || []);
      setTotalApps(apps?.total || 0);
      setTotalCerts(certsRes.data?.data?.total || 0);
      setTotalRooms((roomsRes.data?.data || []).length);
      setOpenOpps(oppsRes.data?.data?.total || 0);
    }).finally(() => setLoading(false));
  }, []);

  const firstName = volunteer?.name?.split(" ")[0] || "Volunteer";

  const statCards = [
    { label: "Open Opportunities", value: openOpps,    sub: "Available now",          icon: MagnifyingGlassIcon,      color: "violet",  href: "/user/opportunities" },
    { label: "My Applications",    value: totalApps,   sub: "Total submitted",        icon: ClipboardDocumentListIcon, color: "blue",    href: "/user/applications" },
    { label: "Certificates",       value: totalCerts,  sub: "Earned",                 icon: DocumentCheckIcon,         color: "emerald", href: "/user/certificates" },
    { label: "Chat Rooms",         value: totalRooms,  sub: "Active memberships",     icon: ChatBubbleLeftRightIcon,   color: "amber",   href: "/user/rooms" },
  ];

  const colorMap: Record<string, { bg: string; icon: string; sub: string }> = {
    violet:  { bg: "bg-violet-50 border-violet-100",  icon: "text-violet-500",  sub: "text-violet-600" },
    blue:    { bg: "bg-blue-50 border-blue-100",      icon: "text-blue-500",    sub: "text-blue-600" },
    emerald: { bg: "bg-emerald-50 border-emerald-100",icon: "text-emerald-500", sub: "text-emerald-600" },
    amber:   { bg: "bg-amber-50 border-amber-100",    icon: "text-amber-500",   sub: "text-amber-600" },
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        :root {
          --font-heading: 'Inter', sans-serif;
          --font-body: 'DM Sans', system-ui, sans-serif;
        }
      `}</style>
      <div className="space-y-6 max-w-5xl" style={{ fontFamily: "var(--font-body)" }}>
        {/* Welcome banner */}
        <div className="bg-linear-to-r from-violet-600 to-purple-600 rounded-2xl p-5 md:p-6 text-white" style={{ animation: "fadeUp 0.35s ease both" }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-violet-200 text-sm font-medium" style={{ fontFamily: "var(--font-body)" }}>Welcome back,</p>
              <h1 className="text-xl md:text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.03em" }}>{firstName}</h1>
              <p className="text-violet-200/80 text-sm mt-1.5" style={{ fontFamily: "var(--font-body)" }}>Ready to make a difference today?</p>
            </div>
            <button
              onClick={() => router.push("/user/opportunities")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors cursor-pointer shrink-0"
            >
              <SparklesIcon className="h-4 w-4" />
              Browse Opportunities
            </button>
          </div>
        </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : statCards.map((card) => {
              const c = colorMap[card.color];
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  onClick={() => router.push(card.href)}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:shadow-sm transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${c.bg}`}>
                      <Icon className={`h-4 w-4 ${c.icon}`} />
                    </div>
                    <span className="text-[10px] md:text-[11px] font-medium text-gray-400 uppercase tracking-wider leading-tight mt-1">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className={`text-[11px] font-medium mt-0.5 ${c.sub}`}>{card.sub}</p>
                </button>
              );
            })}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Applications</h2>
          <button
            onClick={() => router.push("/user/applications")}
            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 cursor-pointer"
          >
            View all <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : recentApps.length === 0 ? (
          <div className="py-14 text-center">
            <ClipboardDocumentListIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No applications yet</p>
            <button
              onClick={() => router.push("/user/opportunities")}
              className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium cursor-pointer"
            >
              Browse opportunities →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentApps.map((app) => (
              <div
                key={app.id}
                onClick={() => router.push(`/user/opportunities/${app.opportunity.id}`)}
                className="px-5 md:px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <div className="h-9 w-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 text-xs font-bold text-violet-600">
                  {app.opportunity.charity.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{app.opportunity.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.opportunity.charity.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${STATUS_STYLE[app.status]}`}>
                    {app.status}
                  </span>
                  {app.status === "PENDING"  && <ClockIcon className="h-4 w-4 text-amber-400 hidden sm:block" />}
                  {app.status === "APPROVED" && <CheckCircleIcon className="h-4 w-4 text-emerald-500 hidden sm:block" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
