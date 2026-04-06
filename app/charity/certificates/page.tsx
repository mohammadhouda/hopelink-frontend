"use client";
import { useState, useEffect } from "react";
import { DocumentCheckIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import charityApi from "@/lib/charityAxios";
import Dropdown, { DropdownOption } from "@/components/charity/Dropdown";

interface Certificate {
  id: number;
  issuedAt: string;
  certificateData: {
    charityName: string;
    volunteerName: string;
    opportunityTitle: string;
    startDate: string;
    endDate: string;
    issuedAt: string;
  };
  volunteer: {
    id: number;
    name: string;
    email: string;
  };
  opportunity: {
    id: number;
    title: string;
  };
  certificateUrl?: string;
}

interface EndedOpportunity {
  id: number;
  title: string;
}

interface ApprovedVolunteer {
  applicationId: number;
  volunteerName: string;
}

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIndividual, setShowIndividual] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [opportunities, setOpportunities] = useState<EndedOpportunity[]>([]);
  const [volunteers, setVolunteers] = useState<ApprovedVolunteer[]>([]);
  const [selectedOpp, setSelectedOpp] = useState("");
  const [selectedVol, setSelectedVol] = useState("");
  const [bulkOpp, setBulkOpp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingVols, setLoadingVols] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const fetchCertificates = () => {
    charityApi.get("/api/charity/certificates")
      .then((res) => setCertificates(res.data?.data?.certificates || []))
      .finally(() => setLoading(false));
  };

  const loadOpportunities = async () => {
    const res = await charityApi.get("/api/charity/opportunities?status=ENDED");
    setOpportunities(res.data?.data?.opportunities || []);
  };

  useEffect(() => { fetchCertificates(); }, []);

  const openIndividual = async () => {
    await loadOpportunities();
    setSelectedOpp("");
    setSelectedVol("");
    setShowIndividual(true);
  };

  const openBulk = async () => {
    await loadOpportunities();
    setBulkOpp("");
    setBulkResult(null);
    setShowBulk(true);
  };

  const onOppChange = async (oppId: string) => {
    setSelectedOpp(oppId);
    setSelectedVol("");
    if (!oppId) { setVolunteers([]); return; }
    setLoadingVols(true);
    const res = await charityApi.get(`/api/charity/applications?opportunityId=${oppId}&status=APPROVED`);
    const apps = res.data?.data?.applications || [];
    setVolunteers(apps.map((a: { id: number; user: { name: string } }) => ({
      applicationId: a.id,
      volunteerName: a.user.name,
    })));
    setLoadingVols(false);
  };

  const handleIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp || !selectedVol) return;
    setSubmitting(true);
    try {
      await charityApi.post("/api/charity/certificates", {
        applicationId: parseInt(selectedVol),
      });
      setShowIndividual(false);
      fetchCertificates();
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkOpp) return;
    setSubmitting(true);
    try {
      const res = await charityApi.post(`/api/charity/certificates/bulk/${bulkOpp}`);
      const count = res.data?.data?.count ?? res.data?.count ?? "All";
      setBulkResult(`${count} certificates issued successfully.`);
      fetchCertificates();
    } finally {
      setSubmitting(false);
    }
  };

  const oppOptions: DropdownOption[] = [
    { value: "", label: "Select opportunity..." },
    ...opportunities.map((o) => ({ value: String(o.id), label: o.title })),
  ];

  const volOptions: DropdownOption[] = [
    { value: "", label: loadingVols ? "Loading..." : "Select volunteer..." },
    ...volunteers.map((v) => ({ value: String(v.applicationId), label: v.volunteerName })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-1">Issue digital certificates to volunteers after completed opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openBulk}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            <SparklesIcon className="h-4 w-4" /> Bulk Issue
          </button>
          <button
            onClick={openIndividual}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" /> Issue Certificate
          </button>
        </div>
      </div>

      {/* Summary card */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <DocumentCheckIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Issued</p>
            <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["VOLUNTEER", "OPPORTUNITY", "ISSUED ON", ""].map((h) => (
                <th key={h || "a"} className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40 mt-1" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-44" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-7 w-20" /></td>
                </tr>
              ))
            ) : certificates.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-14 text-center">
                  <DocumentCheckIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No certificates issued yet.</p>
                </td>
              </tr>
            ) : (
                certificates.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{c.volunteer.name}</p>
                      <p className="text-xs text-gray-400">{c.volunteer.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{c.opportunity.title}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
                      {new Date(c.issuedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.certificateUrl && (
                        <a
                          href={c.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Individual modal */}
      {showIndividual && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Issue Certificate</h2>
            <form onSubmit={handleIndividual} className="space-y-4">
              <FormField label="Ended Opportunity" required>
                <Dropdown
                  value={selectedOpp}
                  onChange={onOppChange}
                  options={oppOptions}
                  placeholder="Select opportunity..."
                />
              </FormField>
              <FormField label="Volunteer" required>
                <Dropdown
                  value={selectedVol}
                  onChange={setSelectedVol}
                  options={volOptions}
                  placeholder={loadingVols ? "Loading..." : "Select volunteer..."}
                  disabled={!selectedOpp || loadingVols}
                />
              </FormField>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowIndividual(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting || !selectedOpp || !selectedVol} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60">
                  {submitting ? "Issuing..." : "Issue Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Bulk Issue Certificates</h2>
                <p className="text-xs text-gray-500">Issues to all approved volunteers at once.</p>
              </div>
            </div>
            {bulkResult ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 font-medium">
                {bulkResult}
              </div>
            ) : (
              <form onSubmit={handleBulk} className="space-y-4">
                <FormField label="Ended Opportunity" required>
                  <Dropdown
                    value={bulkOpp}
                    onChange={setBulkOpp}
                    options={oppOptions}
                    placeholder="Select opportunity..."
                  />
                </FormField>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowBulk(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting || !bulkOpp} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60">
                    {submitting ? "Issuing..." : "Issue to All"}
                  </button>
                </div>
              </form>
            )}
            {bulkResult && (
              <div className="flex justify-end">
                <button onClick={() => setShowBulk(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
