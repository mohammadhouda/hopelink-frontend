'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import Loading from "@/app/loading";
import { useRouter } from "next/navigation";
import {
  EyeIcon, MagnifyingGlassIcon, FunnelIcon,
  ChevronLeftIcon, ChevronRightIcon,
  UserIcon, XMarkIcon, PlusIcon, XCircleIcon,
} from "@heroicons/react/24/outline";
import CustomDropdown, { DropdownOption } from "@/components/CustomDropdown";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: "USER" | "VOLUNTEER";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  baseProfile: {
    phone: string | null;
    avatarUrl: string | null;
    city: string | null;
    country: string | null;
    bio: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_MS = 1000;
const CITIES: DropdownOption[] = [
  { value: "",         label: "Select city" },
  { value: "BEIRUT",   label: "Beirut" },
  { value: "TRIPOLI",  label: "Tripoli" },
  { value: "SIDON",    label: "Sidon" },
  { value: "TYRE",     label: "Tyre" },
  { value: "JOUNIEH",  label: "Jounieh" },
  { value: "BYBLOS",   label: "Byblos" },
  { value: "ZAHLE",    label: "Zahle" },
  { value: "BAALBEK",  label: "Baalbek" },
  { value: "NABATIEH", label: "Nabatieh" },
  { value: "ALEY",     label: "Aley" },
  { value: "CHOUF",    label: "Chouf" },
  { value: "METN",     label: "Metn" },
  { value: "KESREWAN", label: "Kesrewan" },
  { value: "AKKAR",    label: "Akkar" },
  { value: "OTHER",    label: "Other" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const ROLE_STYLES: Record<string, string> = {
  USER:      "bg-blue-50 text-blue-700",
  VOLUNTEER: "bg-emerald-50 text-emerald-700",
};

const AVATAR_STYLES: Record<string, string> = {
  USER:      "bg-blue-50 text-blue-600",
  VOLUNTEER: "bg-emerald-50 text-emerald-700",
};

// ── Shared field components ───────────────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all ${
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
  }`;
}

// ── Add User Modal ────────────────────────────────────────────────────────────
interface AddUserForm {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  city: string;
}

const EMPTY_FORM: AddUserForm = {
  name: "", email: "", password: "", role: "USER", phone: "", city: "",
};

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<AddUserForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<AddUserForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (field: keyof AddUserForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e: Partial<AddUserForm> = {};
    if (!form.name.trim())     e.name     = "Name is required";
    if (!form.email.trim())    e.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address";
    if (!form.password.trim()) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Minimum 8 characters";
    return e;
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError("");
    try {
      await api.post("/api/admin/users", {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        role:     form.role,
        phone:    form.phone.trim() || undefined,
        city:     form.city || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions: DropdownOption[] = [
    { label: "Select Role", value: "select" },
    { label: "User", value: "USER" },
    { label: "Volunteer", value: "VOLUNTEER" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center m-0 justify-center bg-black/40 backdrop-blur-sm px-4"
      onKeyDown={(e) => { if (e.key === "Enter") e.stopPropagation(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Add User</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a new user account</p>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Honeypot */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input type="text" name="username" tabIndex={-1} readOnly />
            <input type="password" name="password" tabIndex={-1} readOnly />
          </div>

          {apiError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              <XCircleIcon className="h-4 w-4 flex-shrink-0" />
              {apiError}
            </div>
          )}

          <Field label="Full name" required error={errors.name}>
            <input type="text" autoComplete="nope" placeholder="e.g. Sara Ahmad" value={form.name} onChange={set("name")} className={inputCls(!!errors.name)} />
          </Field>

          <Field label="Email address" required error={errors.email}>
            <input type="text" inputMode="email" autoComplete="nope" placeholder="sara@example.com" value={form.email} onChange={set("email")} className={inputCls(!!errors.email)} />
          </Field>

          <Field label="Password" required error={errors.password}>
            <input type="password" autoComplete="new-password" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} className={inputCls(!!errors.password)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input type="text" inputMode="tel" autoComplete="nope" placeholder="+961 1 234 567" value={form.phone} onChange={set("phone")} className={inputCls(false)} />
            </Field>
            <Field label="City">
              <CustomDropdown
                value={form.city}
                onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                options={CITIES}
                className="w-full"
              />
            </Field>
          </div>

          <Field label="Role" required>
            <CustomDropdown
              value={form.role}
              onChange={(v) => setForm((p) => ({ ...p, role: v }))}
              options={roleOptions}
              className="w-full"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2">
            {submitting ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating…
              </>
            ) : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [allCities, setAllCities] = useState<string[]>([]);

  const router = useRouter();

  // Fetch city options once
  useEffect(() => {
    api.get("/api/admin/users/cities").then((res) => {
      setAllCities(res.data.data ?? []);
    });
  }, []);

  // Debounce search — guard against modal being open
  const showAddModalRef = useRef(showAddModal);
  useEffect(() => { showAddModalRef.current = showAddModal; }, [showAddModal]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!showAddModalRef.current) {
        setDebouncedSearch(value);
        setCurrentPage(1);
      }
    }, DEBOUNCE_MS);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch)         params.set("search", debouncedSearch);
      if (statusFilter !== "all")  params.set("status", statusFilter);
      if (roleFilter !== "all")    params.set("role", roleFilter);
      if (cityFilter !== "all")    params.set("city", cityFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await api.get(`/api/admin/users?${params.toString()}`);
      setUsers(res.data.data?.items ?? []);
      setTotal(res.data.data?.total ?? 0);
    } catch (err) {
      console.error("Fetching users failed", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, roleFilter, cityFilter, currentPage]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, roleFilter, cityFilter]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const activeFilterCount = [
    statusFilter !== "all",
    roleFilter !== "all",
    cityFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all"); setRoleFilter("all"); setCityFilter("all");
    setSearch(""); setDebouncedSearch("");
  };

  const statusOptions: DropdownOption[] = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "active" },
    { label: "Suspended", value: "suspended" },
  ];
  const roleOptions: DropdownOption[] = [
    { label: "All Roles", value: "all" },
    { label: "User", value: "USER" },
    { label: "Volunteer", value: "VOLUNTEER" },
  ];
  const cityOptions: DropdownOption[] = [
    { label: "All Cities", value: "all" },
    ...allCities.map((c) => ({ label: c, value: c })),
  ];

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {showAddModal && (
        <AddUserModal onClose={() => setShowAddModal(false)} onSuccess={fetchUsers} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {total === 1 ? "user" : "users"} found
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
        >
          <PlusIcon className="h-4 w-4" />
          Add user
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setDebouncedSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
              showFilters || activeFilterCount > 0
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 flex-wrap">
            <CustomDropdown value={statusFilter} onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} options={statusOptions} className="w-40" />
            <CustomDropdown value={roleFilter}   onChange={(v) => { setRoleFilter(v);   setCurrentPage(1); }} options={roleOptions}   className="w-36" />
            <CustomDropdown value={cityFilter}   onChange={(v) => { setCityFilter(v);   setCurrentPage(1); }} options={cityOptions}   className="w-40" />
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserIcon className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No users match your filters</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id} className={`group transition-colors hover:bg-gray-50/80 ${idx !== users.length - 1 ? "border-b border-gray-50" : ""}`}>
                      {/* User cell */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${AVATAR_STYLES[user.role]}`}>
                            {initials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{user.baseProfile?.city ?? "—"}</span>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${ROLE_STYLES[user.role]}`}>
                          {user.role === "VOLUNTEER" ? "Volunteer" : "User"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Last login */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{formatDate(user.lastLoginAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-medium text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                  {" – "}
                  <span className="font-medium text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span>
                  {" of "}
                  <span className="font-medium text-gray-700">{total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button type="button" key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${page === currentPage ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                      {page}
                    </button>
                  ))}
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}