"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HeartIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { CITY_OPTIONS, CATEGORY_OPTIONS } from "@/lib/constants";

type Field = "name" | "email" | "phone" | "city" | "category" | "message";

interface FormState {
  name: string;
  email: string;
  phone: string;
  city: string;
  category: string;
  message: string;
}

const INITIAL: FormState = {
  name: "", email: "", phone: "", city: "", category: "", message: "",
};

export default function CharityRegisterPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    setServerError("");
  }

  function validate(): boolean {
    const e: Partial<Record<Field, string>> = {};
    if (!form.name.trim())  e.name  = "Organisation name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:     form.name.trim(),
            email:    form.email.trim(),
            phone:    form.phone.trim() || undefined,
            city:     form.city     || undefined,
            category: form.category || undefined,
            message:  form.message.trim() || undefined,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Unable to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success state ───────────────────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-5">Request Submitted!</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Thank you for registering <strong className="text-gray-800">{form.name}</strong> with
            Hope Link. Our team will review your request and reach out to{" "}
            <strong className="text-gray-800">{form.email}</strong> within a few business days.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/charity/login"
              className="block text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl transition-colors text-center"
            >
              Go to Charity Login
            </Link>
            <Link
              href="/"
              className="block text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] shrink-0 flex-col justify-between bg-emerald-700 text-white px-10 py-12">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12">
            <span className="text-base font-bold">Hope Link</span>
          </Link>

          <h1 className="text-3xl font-extrabold leading-snug">
            Bring your NGO to Hope Link
          </h1>
          <p className="text-emerald-100 mt-4 text-sm leading-relaxed">
            Submit a registration request and our team will set up your charity account.
            Once approved, you can post opportunities, review volunteer applications,
            and grow your impact.
          </p>

          <div className="mt-10 space-y-5">
            {[
              "Post volunteering opportunities across Lebanon",
              "Receive and manage volunteer applications",
              "Issue certificates and track volunteer hours",
              "Real-time chat rooms with your volunteer teams",
              "Analytics dashboard to measure your impact",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircleIcon className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                <span className="text-sm text-emerald-100">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        <div className="max-w-lg mx-auto w-full">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-base font-bold text-gray-900">Hope Link</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <BuildingOfficeIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Register Your NGO</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Fill in the details below — our team will review and get back to you.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-4 mb-8"
          >
            <ArrowLeftIcon className="h-3 w-3" />
            Back to Home
          </Link>

          {serverError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <ExclamationCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Organisation Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Lebanese Red Cross"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:ring-1 outline-none transition-colors ${
                  errors.name
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-300 focus:ring-emerald-100"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Contact Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="contact@yourorg.org"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl bg-gray-50 focus:bg-white focus:ring-1 outline-none transition-colors ${
                  errors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-300 focus:ring-emerald-100"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone + City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+961 ..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  City <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 outline-none"
                >
                  <option value="">Select city</option>
                  {CITY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Category <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 outline-none"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Tell us about your organisation{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                rows={4}
                placeholder="Briefly describe your NGO's mission, the type of volunteering you need, and how Hope Link can help..."
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-300 focus:ring-1 focus:ring-emerald-100 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit Registration Request"}
            </button>

            <p className="text-xs text-center text-gray-400">
              Already have an account?{" "}
              <Link href="/charity/login" className="text-emerald-600 hover:underline font-medium">
                Sign in to your charity portal
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
