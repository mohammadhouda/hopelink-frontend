"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import charityApi from "@/lib/charityAxios";

export default function CharityLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await charityApi.post("/api/auth/login", { email, password });
      router.push("/charity/dashboard");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow accents */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-teal-400/8 rounded-full blur-[100px]" />

        {/* Floating geometric shapes */}
        <div className="absolute top-20 right-16 w-20 h-20 border border-white/5 rounded-2xl rotate-12 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 left-20 w-14 h-14 border border-white/5 rounded-xl -rotate-6 animate-[float_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/2 right-28 w-8 h-8 bg-emerald-400/10 rounded-lg rotate-45 animate-[float_6s_ease-in-out_infinite_2s]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-white tracking-tight">
                Hope Link
              </span>
            </div>
          </div>

          {/* Center message */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Empower
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                your mission
              </span>
              <br />
              with every volunteer.
            </h1>
            <p className="text-emerald-300/60 mt-6 text-base leading-relaxed">
              Manage your opportunities, connect with volunteers, and track the
              impact of your charity all from one place.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-10">
              {[
                { value: "+2k", label: "Volunteers" },
                { value: "+500", label: "Opportunities" },
                { value: "5.2K", label: "Lives Impacted" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-emerald-400/50 mt-1 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-emerald-900/60">
            &copy; {new Date().getFullYear()} Hope Link Platform. All rights
            reserved.
          </p>
        </div>
      </div>

      {/* ── Right panel — login form ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 relative">
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">
              Hope Link
            </span>
          </div>

          {/* Charity badge */}
          <div className="flex lg:justify-start justify-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Charity Portal
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Sign in to manage your volunteers and opportunities.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="h-3 w-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="charity@example.org"
                  required
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-11 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Bottom */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Charity portal for registered organizations.
              <br />
              <span className="text-gray-300 mt-1 block">
                Need an account?{" "}
                <a
                  href="/charity/register"
                  className="text-emerald-500 hover:text-emerald-600 font-medium transition-colors"
                >
                  Register your charity
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(var(--r, 12deg));
          }
          50% {
            transform: translateY(-20px) rotate(var(--r, 12deg));
          }
        }
      `}</style>
    </div>
  );
}