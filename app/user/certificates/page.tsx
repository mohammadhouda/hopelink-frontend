"use client";
import { useState, useEffect } from "react";
import { DocumentCheckIcon, CalendarDaysIcon, BuildingOffice2Icon, MapPinIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import userApi from "@/lib/userAxios";
import { formatDate } from "@/lib/dateUtils";

interface Certificate {
  id: number;
  issuedAt: string;
  pdfUrl?: string;
  opportunity: { id: number; title: string; startDate?: string; endDate?: string; location?: string };
  charity: { id: number; name: string; logoUrl?: string };
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  useEffect(() => {
    setLoading(true);
    userApi.get(`/api/user/certificates?page=${page}&limit=${limit}`)
      .then((res) => {
        setCertificates(res.data?.data?.certificates || []);
        setTotal(res.data?.data?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / limit);

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
      <div className="space-y-5 max-w-5xl" style={{ fontFamily: "var(--font-body)" }}>
        {/* Header */}
        <header style={{ animation: "fadeUp 0.35s ease both" }}>
          <h1
            style={{
              fontSize: 24, fontWeight: 800, color: "#111827", margin: 0,
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.03em",
            }}
          >
            My Certificates
          </h1>
          <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: "4px 0 0" }}>
            Certificates earned from completed volunteering opportunities.
          </p>
        </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-44" />)
          : certificates.length === 0
          ? (
            <div className="col-span-full py-20 text-center">
              <DocumentCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No certificates yet</p>
              <p className="text-xs text-gray-300 mt-1">Complete volunteering opportunities to earn certificates.</p>
            </div>
          )
          : certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Top accent */}
              <div className="h-1.5 bg-linear-to-r from-violet-500 to-purple-500" />
              <div className="p-5 space-y-3">
                {/* Icon + title */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <DocumentCheckIcon className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                      {cert.opportunity.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <BuildingOffice2Icon className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500 truncate">{cert.charity.name}</p>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="space-y-1.5 border-t border-gray-50 pt-3">
                  {cert.opportunity.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MapPinIcon className="h-3 w-3 shrink-0" /> {cert.opportunity.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <CalendarDaysIcon className="h-3 w-3 shrink-0" />
                    {formatDate(cert.opportunity.startDate)} — {formatDate(cert.opportunity.endDate)}
                  </div>
                </div>

                {/* Issued badge */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Certificate Issued
                  </span>
                  <span className="text-[11px] text-gray-400">{formatDate(cert.issuedAt)}</span>
                </div>

                {/* Download */}
                {cert.pdfUrl && (
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full mt-1 py-2 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <DocumentArrowDownIcon className="h-3.5 w-3.5" /> Download PDF
                  </a>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Previous</button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Next</button>
        </div>
      )}
    </div>
    </>
  );
}
