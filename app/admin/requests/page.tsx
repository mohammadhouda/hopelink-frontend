"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/axios";
import Loading from "@/app/loading";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import CustomDropdown, { DropdownOption } from "@/components/CustomDropdown";
import { useSearchParams } from "next/navigation";

// ── Types
interface RegistrationRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "DECLINED";
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  category: string | null;
  message: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface VerificationRequest {
  id: number;
  status: "PENDING" | "APPROVED" | "DECLINED";
  documents: string[];
  message: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    email: string;
    charityAccount: {
      name: string;
      logoUrl: string | null;
      city: string | null;
      category: string | null;
      isVerified: boolean;
    } | null;
  };
}

const ITEMS_PER_PAGE = 10;

// ── Helpers
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border border-red-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: ClockIcon,
  APPROVED: CheckCircleIcon,
  DECLINED: XCircleIcon,
};

// ── Action Modal
function ActionModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  showNote,
  noteLabel,
  notePlaceholder,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  showNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 m-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md">
        <div className="flex items-start gap-3 p-6 pb-4">
          <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        {showNote && (
          <div className="px-6 pb-4">
            <label className="text-xs font-medium text-gray-700 block mb-1.5">
              {noteLabel ?? "Note"}{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={notePlaceholder ?? "Add a note..."}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2 ${confirmClass}`}
          >
            {loading && (
              <svg
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Registration Detail Drawer
function RegistrationDetail({
  req,
  onClose,
  onApprove,
  onDecline,
  actionLoading,
}: {
  req: RegistrationRequest;
  onClose: () => void;
  onApprove: () => void;
  onDecline: () => void;
  actionLoading: boolean;
}) {
  return (
    <div className="fixed m-0 inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Registration Request
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              #{req.id} · {formatDate(req.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
          >
            <XCircleIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[req.status]}`}
          >
            {req.status}
          </span>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Organization info
            </p>
            <div className="space-y-0">
              {[
                { label: "Name", value: req.name },
                { label: "Email", value: req.email },
                { label: "Phone", value: req.phone },
                { label: "City", value: req.city },
                { label: "Category", value: req.category },
              ].map(({ label, value }) =>
                value ? (
                  <div
                    key={label}
                    className="flex items-start justify-between py-2.5 border-b border-gray-50"
                  >
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0">
                      {label}
                    </span>
                    <span className="text-sm text-gray-800 text-right">
                      {value}
                    </span>
                  </div>
                ) : null,
              )}
            </div>
          </div>

          {req.message && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Message
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 leading-relaxed">
                {req.message}
              </p>
            </div>
          )}

          {req.reviewNote && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Review note
              </p>
              <p className="text-sm text-gray-700 bg-red-50 rounded-lg p-3 border border-red-100 leading-relaxed">
                {req.reviewNote}
              </p>
            </div>
          )}
        </div>

        {req.status === "PENDING" && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onApprove}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" /> Approve
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" /> Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Verification Detail Drawer
function VerificationDetail({
  req,
  onClose,
  onApprove,
  onDecline,
  actionLoading,
}: {
  req: VerificationRequest;
  onClose: () => void;
  onApprove: () => void;
  onDecline: () => void;
  actionLoading: boolean;
}) {
  const charity = req.user.charityAccount;
  return (
    <div className="fixed m-0 inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Verification Request
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              #{req.id} · {formatDate(req.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
          >
            <XCircleIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[req.status]}`}
          >
            {req.status}
          </span>

          {charity && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Charity
              </p>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                <div className="h-10 w-10 rounded-lg bg-gray-200 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {charity.logoUrl ? (
                    <img
                      src={charity.logoUrl}
                      alt={charity.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {charity.name}
                  </p>
                  <p className="text-xs text-gray-500">{req.user.email}</p>
                </div>
              </div>
              <div className="space-y-0">
                {[
                  { label: "City", value: charity.city },
                  { label: "Category", value: charity.category },
                ].map(({ label, value }) =>
                  value ? (
                    <div
                      key={label}
                      className="flex items-start justify-between py-2.5 border-b border-gray-50"
                    >
                      <span className="text-xs text-gray-400 w-24 flex-shrink-0">
                        {label}
                      </span>
                      <span className="text-sm text-gray-800 text-right">
                        {value}
                      </span>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Documents{" "}
              <span className="text-gray-300 font-normal">
                ({req.documents.length})
              </span>
            </p>
            {req.documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents attached.</p>
            ) : (
              <div className="space-y-2">
                {req.documents.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                  >
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-blue-600 truncate">
                      Document {i + 1}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {req.message && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Message
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 leading-relaxed">
                {req.message}
              </p>
            </div>
          )}

          {req.reviewNote && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Review note
              </p>
              <p className="text-sm text-gray-700 bg-red-50 rounded-lg p-3 border border-red-100 leading-relaxed">
                {req.reviewNote}
              </p>
            </div>
          )}
        </div>

        {req.status === "PENDING" && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onApprove}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" /> Approve
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" /> Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Paginationl
function Pagination({
  current,
  total,
  totalItems,
  itemsPerPage,
  onChange,
}: {
  current: number;
  total: number;
  totalItems: number;
  itemsPerPage: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-700">
          {(current - 1) * itemsPerPage + 1}
        </span>
        {" – "}
        <span className="font-medium text-gray-700">
          {Math.min(current * itemsPerPage, totalItems)}
        </span>
        {" of "}
        <span className="font-medium text-gray-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current === 1}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => onChange(page)}
            className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${page === current ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(Math.min(total, current + 1))}
          disabled={current === total}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Pagel
export default function Requests() {
  const [activeTab, setActiveTab] = useState<"registration" | "verification">(
    "registration",
  );

  const [regRequests, setRegRequests] = useState<RegistrationRequest[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regLoading, setRegLoading] = useState(true);
  const [regPage, setRegPage] = useState(1);
  const [regStatus, setRegStatus] = useState("all");
  const [regSelected, setRegSelected] = useState<RegistrationRequest | null>(
    null,
  );

  const [verRequests, setVerRequests] = useState<VerificationRequest[]>([]);
  const [verTotal, setVerTotal] = useState(0);
  const [verLoading, setVerLoading] = useState(true);
  const [verPage, setVerPage] = useState(1);
  const [verStatus, setVerStatus] = useState("all");
  const [verSelected, setVerSelected] = useState<VerificationRequest | null>(
    null,
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<{
    type: "approve" | "decline";
    tab: "registration" | "verification";
    id: number;
  } | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const searchParams = useSearchParams();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRegistration = useCallback(async () => {
    setRegLoading(true);
    try {
      const params = new URLSearchParams();
      if (regStatus !== "all") params.set("status", regStatus);
      params.set("page", String(regPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      const res = await api.get(`/api/requests/registration?${params}`);
      setRegRequests(res.data.data?.items ?? []);
      setRegTotal(res.data.data?.total ?? 0);
    } catch {
      setRegRequests([]);
      setRegTotal(0);
    } finally {
      setRegLoading(false);
    }
  }, [regStatus, regPage]);

  const fetchVerification = useCallback(async () => {
    setVerLoading(true);
    try {
      const params = new URLSearchParams();
      if (verStatus !== "all") params.set("status", verStatus);
      params.set("page", String(verPage));
      params.set("limit", String(ITEMS_PER_PAGE));
      const res = await api.get(`/api/requests/verification?${params}`);
      setVerRequests(res.data.data?.items ?? []);
      setVerTotal(res.data.data?.total ?? 0);
    } catch {
      setVerRequests([]);
      setVerTotal(0);
    } finally {
      setVerLoading(false);
    }
  }, [verStatus, verPage]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);
  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);
  useEffect(() => {
    setRegPage(1);
  }, [regStatus]);
  useEffect(() => {
    setVerPage(1);
  }, [verStatus]);

  const handleApprove = async (note: string) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      const endpoint =
        modal.tab === "registration"
          ? `/api/requests/registration/${modal.id}/approve`
          : `/api/requests/verification/${modal.id}/approve`;
      await api.patch(endpoint, {});
      showToast("Request approved successfully");
      setModal(null);
      setRegSelected(null);
      setVerSelected(null);
      modal.tab === "registration" ? fetchRegistration() : fetchVerification();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (note: string) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      const endpoint =
        modal.tab === "registration"
          ? `/api/requests/registration/${modal.id}/decline`
          : `/api/requests/verification/${modal.id}/decline`;
      await api.patch(endpoint, { reviewNote: note || undefined });
      showToast("Request declined");
      setModal(null);
      setRegSelected(null);
      setVerSelected(null);
      modal.tab === "registration" ? fetchRegistration() : fetchVerification();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    const openId = searchParams.get("open");

    if (tab === "registration" || tab === "verification") {
      setActiveTab(tab);
    }

    if (openId) {
      const id = parseInt(openId, 10);
      if (isNaN(id)) return;

      if (tab === "verification") {
        // Wait for verification data to load, then open the drawer
        const findAndOpen = () => {
          const match = verRequests.find((r) => r.id === id);
          if (match) {
            setVerSelected(match);
          }
        };
        if (!verLoading) findAndOpen();
      } else {
        // Default to registration
        const findAndOpen = () => {
          const match = regRequests.find((r) => r.id === id);
          if (match) {
            setRegSelected(match);
          }
        };
        if (!regLoading) findAndOpen();
      }
    }
  }, [searchParams, regRequests, regLoading, verRequests, verLoading]);

  const statusOptions: DropdownOption[] = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Declined", value: "DECLINED" },
  ];

  const regTotalPages = Math.ceil(regTotal / ITEMS_PER_PAGE);
  const verTotalPages = Math.ceil(verTotal / ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            toast.type === "success"
              ? "bg-white border-emerald-200 text-emerald-700"
              : "bg-white border-red-200 text-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircleSolid className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircleIcon className="h-4 w-4 text-red-500" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Action modal */}
      {modal && (
        <ActionModal
          title={
            modal.type === "approve"
              ? "Approve this request?"
              : "Decline this request?"
          }
          message={
            modal.type === "approve"
              ? modal.tab === "registration"
                ? "A charity account will be created and a temporary password generated."
                : "The charity will be marked as verified."
              : "The requester will not be notified automatically."
          }
          confirmLabel={modal.type === "approve" ? "Yes, approve" : "Decline"}
          confirmClass={
            modal.type === "approve"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }
          showNote={modal.type === "decline"}
          noteLabel="Reason for declining"
          notePlaceholder="e.g. Incomplete information, invalid documents..."
          onConfirm={modal.type === "approve" ? handleApprove : handleDecline}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}

      {/* Detail drawers */}
      {regSelected && (
        <RegistrationDetail
          req={regSelected}
          onClose={() => setRegSelected(null)}
          onApprove={() =>
            setModal({
              type: "approve",
              tab: "registration",
              id: regSelected.id,
            })
          }
          onDecline={() =>
            setModal({
              type: "decline",
              tab: "registration",
              id: regSelected.id,
            })
          }
          actionLoading={actionLoading}
        />
      )}
      {verSelected && (
        <VerificationDetail
          req={verSelected}
          onClose={() => setVerSelected(null)}
          onApprove={() =>
            setModal({
              type: "approve",
              tab: "verification",
              id: verSelected.id,
            })
          }
          onDecline={() =>
            setModal({
              type: "decline",
              tab: "verification",
              id: verSelected.id,
            })
          }
          actionLoading={actionLoading}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review and manage incoming requests
        </p>
      </div>

      {/* Card with tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex">
            {(["registration", "verification"] as const).map((tab) => {
              const count = tab === "registration" ? regTotal : verTotal;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3.5 text-sm font-medium capitalize transition-colors cursor-pointer border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="py-2">
            <CustomDropdown
              value={activeTab === "registration" ? regStatus : verStatus}
              onChange={(v) =>
                activeTab === "registration" ? setRegStatus(v) : setVerStatus(v)
              }
              options={statusOptions}
              className="w-40"
            />
          </div>
        </div>

        {/* Registration tab */}
        {activeTab === "registration" &&
          (regLoading ? (
            <div className="py-16 flex justify-center">
              <Loading />
            </div>
          ) : regRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BuildingOfficeIcon className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                No registration requests
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {regStatus !== "all"
                  ? "Try changing the status filter"
                  : "New requests will appear here"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {regRequests.map((req, idx) => {
                      const StatusIcon = STATUS_ICONS[req.status];
                      return (
                        <tr
                          key={req.id}
                          className={`group transition-colors hover:bg-gray-50/80 ${idx !== regRequests.length - 1 ? "border-b border-gray-50" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">
                              {req.name}
                            </p>
                            <p className="text-xs text-gray-500">{req.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {req.city ?? "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {req.category ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                {req.category}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[req.status]}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">
                              {formatDate(req.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setRegSelected(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <EyeIcon className="h-3.5 w-3.5" /> View
                              </button>
                              {req.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModal({
                                        type: "approve",
                                        tab: "registration",
                                        id: req.id,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <CheckCircleIcon className="h-3.5 w-3.5" />{" "}
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModal({
                                        type: "decline",
                                        tab: "registration",
                                        id: req.id,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <XCircleIcon className="h-3.5 w-3.5" />{" "}
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {regTotalPages > 1 && (
                <Pagination
                  current={regPage}
                  total={regTotalPages}
                  totalItems={regTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onChange={setRegPage}
                />
              )}
            </>
          ))}

        {/* Verification tab */}
        {activeTab === "verification" &&
          (verLoading ? (
            <div className="py-16 flex justify-center">
              <Loading />
            </div>
          ) : verRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BuildingOfficeIcon className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                No verification requests
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {verStatus !== "all"
                  ? "Try changing the status filter"
                  : "New requests will appear here"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Charity
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {verRequests.map((req, idx) => {
                      const charity = req.user.charityAccount;
                      const StatusIcon = STATUS_ICONS[req.status];
                      return (
                        <tr
                          key={req.id}
                          className={`group transition-colors hover:bg-gray-50/80 ${idx !== verRequests.length - 1 ? "border-b border-gray-50" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {charity?.logoUrl ? (
                                  <img
                                    src={charity.logoUrl}
                                    alt={charity.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {charity?.name ?? "—"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {req.user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                              <DocumentTextIcon className="h-3.5 w-3.5 text-gray-400" />
                              {req.documents.length}{" "}
                              {req.documents.length === 1 ? "file" : "files"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[req.status]}`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">
                              {formatDate(req.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => setVerSelected(req)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <EyeIcon className="h-3.5 w-3.5" /> View
                              </button>
                              {req.status === "PENDING" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModal({
                                        type: "approve",
                                        tab: "verification",
                                        id: req.id,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <CheckCircleIcon className="h-3.5 w-3.5" />{" "}
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModal({
                                        type: "decline",
                                        tab: "verification",
                                        id: req.id,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <XCircleIcon className="h-3.5 w-3.5" />{" "}
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {verTotalPages > 1 && (
                <Pagination
                  current={verPage}
                  total={verTotalPages}
                  totalItems={verTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onChange={setVerPage}
                />
              )}
            </>
          ))}
      </div>
    </div>
  );
}