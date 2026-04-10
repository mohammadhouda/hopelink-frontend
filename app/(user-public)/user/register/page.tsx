"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import userApi from "@/lib/userAxios";

export default function UserRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await userApi.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      router.push("/user/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-violet-900">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-purple-400/8 rounded-full blur-[100px]" />
        <div className="absolute top-20 right-16 w-20 h-20 border border-white/5 rounded-2xl rotate-12 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-32 left-20 w-14 h-14 border border-white/5 rounded-xl -rotate-6 animate-[float_10s_ease-in-out_infinite_1s]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <span className="text-xl font-semibold text-white tracking-tight">Hope Link</span>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Start your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-purple-300">
                volunteer journey
              </span>
              <br />
              today.
            </h1>
            <p className="text-violet-300/60 mt-6 text-base leading-relaxed">
              Join thousands of volunteers making a real impact. Find opportunities that match your skills and passion.
            </p>
            <div className="flex gap-8 mt-10">
              {[
                { value: "Free", label: "Always" },
                { value: "120+", label: "Charities" },
                { value: "500+", label: "Opportunities" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-violet-400/50 mt-1 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-violet-900/60">&copy; {new Date().getFullYear()} Hope Link Platform. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">Hope Link</span>
          </div>

          <div className="flex lg:justify-start justify-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
              <span className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">Create Account</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Join Hope Link</h2>
            <p className="text-sm text-gray-500 mt-2">Create your volunteer account in seconds.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="h-3 w-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                required
                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full px-4 pr-11 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-gray-300"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repeat your password"
                required
                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/user/login" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 12deg)); }
          50% { transform: translateY(-20px) rotate(var(--r, 12deg)); }
        }
      `}</style>
    </div>
  );
}
