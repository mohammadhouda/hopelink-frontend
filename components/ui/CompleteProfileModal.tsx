"use client";
import { XMarkIcon, ExclamationTriangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface CompleteProfileModalProps {
  onClose: () => void;
  missingFields: string[];
  action: 'post' | 'apply';
  accent?: "violet" | "emerald";
}

export default function CompleteProfileModal({
  onClose,
  missingFields,
  action,
  accent = "violet",
}: CompleteProfileModalProps) {
  const router = useRouter();

  const accentBtn =
    accent === "emerald"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-violet-600 hover:bg-violet-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900">Complete Your Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <UserCircleIcon className="h-6 w-6 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                {action === 'apply'
                  ? 'You need to complete your profile before you can apply to opportunities.'
                  : 'You need to complete your profile before you can post in the feed.'}
              </p>
            </div>
          </div>

          {/* Missing fields */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Missing Information:</p>
            <ul className="space-y-1.5">
              {missingFields.map((field) => (
                <li key={field} className="flex items-center gap-2 text-sm text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  {field}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-500">
            Completing your profile helps charities and other volunteers know more about you.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              router.push("/user/profile");
            }}
            className={`px-5 py-2 rounded-xl text-sm font-medium text-white transition-all ${accentBtn} cursor-pointer`}
          >
            Go to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
