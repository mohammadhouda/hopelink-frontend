'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import Loading from "@/app/loading";
import { useRouter } from "next/navigation";
import {
  XCircleIcon, EyeIcon, MagnifyingGlassIcon,
  FunnelIcon, ChevronLeftIcon, ChevronRightIcon,
  BuildingOfficeIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import CustomDropdown, { DropdownOption } from "@/components/CustomDropdown";

interface Charity {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  city: string;
  category: string;
  isVerified: boolean;
  user: { id: number; email: string; isActive: boolean };
}

const ITEMS_PER_PAGE = 8;
const DEBOUNCE_MS = 1000;

export default function NGOs() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);

  const router = useRouter();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    api.get("/api/charities").then((res) => {
      const all: Charity[] = res.data.data?.items ?? [];
      setAllCategories([...new Set(all.map((c) => c.category))].sort());
      setAllCities([...new Set(all.map((c) => c.city))].sort());
    });
  }, []);

  const fetchCharities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (cityFilter !== "all") params.set("city", cityFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(ITEMS_PER_PAGE));

      const res = await api.get(`/api/charities?${params.toString()}`);
      setCharities(res.data.data?.items ?? []);
      setTotal(res.data.data?.total ?? 0);
    } catch (err) {
      console.error("Fetching charities failed", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, categoryFilter, cityFilter, currentPage]);

  useEffect(() => { fetchCharities(); }, [fetchCharities]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, categoryFilter, cityFilter]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const activeFilterCount = [
    statusFilter !== "all",
    categoryFilter !== "all",
    cityFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setCityFilter("all");
    setSearch("");
    setDebouncedSearch("");
  };

  const statusOptions: DropdownOption[] = [
    { label: "All Statuses", value: "all" },
    { label: "Verified", value: "verified" },
    { label: "Unverified", value: "unverified" },
  ];
  const categoryOptions: DropdownOption[] = [
    { label: "All Categories", value: "all" },
    ...allCategories.map((cat) => ({ label: cat, value: cat })),
  ];
  const cityOptions: DropdownOption[] = [
    { label: "All Cities", value: "all" },
    ...allCities.map((city) => ({ label: city, value: city })),
  ];

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">NGOs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {total === 1 ? "organization" : "organizations"} found
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
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
            <CustomDropdown
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
              options={statusOptions}
              className="w-40"
            />
            <CustomDropdown
              value={categoryFilter}
              onChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}
              options={categoryOptions}
              className="w-44"
            />
            <CustomDropdown
              value={cityFilter}
              onChange={(v) => { setCityFilter(v); setCurrentPage(1); }}
              options={cityOptions}
              className="w-40"
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {charities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BuildingOfficeIcon className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No organizations match your filters</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              >
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
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities.map((charity, idx) => (
                    <tr
                      key={charity.id}
                      className={`group transition-colors hover:bg-gray-50/80 ${idx !== charities.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {charity.logoUrl ? (
                              <img src={charity.logoUrl} alt={charity.name} className="h-full w-full object-cover" />
                            ) : (
                              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{charity.name}</p>
                            <p className="text-xs text-gray-500 truncate">{charity.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{charity.city}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          {charity.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {charity.isVerified ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircleSolid className="h-4 w-4 text-emerald-500" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <XCircleIcon className="h-4 w-4 text-gray-400" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => router.push(`/charities/${charity.id}`)}
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
                  Showing{" "}
                  <span className="font-medium text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                  {" – "}
                  <span className="font-medium text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, total)}</span>
                  {" of "}
                  <span className="font-medium text-gray-700">{total}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        page === currentPage ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
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