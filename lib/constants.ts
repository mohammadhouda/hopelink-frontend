/**
 * Shared constants derived from the backend Prisma enums and domain config.
 * Single source of truth — import from here instead of redeclaring per-page.
 */

// ─── City ─────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

/** All Lebanese cities matching the backend City enum. No empty placeholder included —
 *  prepend one in your component if the field is optional. */
export const CITY_OPTIONS: SelectOption[] = [
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

/** CITY_OPTIONS with an empty-value placeholder at the front for optional selects. */
export const CITY_OPTIONS_WITH_PLACEHOLDER = (label = "Select city"): SelectOption[] => [
  { value: "", label },
  ...CITY_OPTIONS,
];

/** Human-readable label for a city enum value. Falls back to the raw value. */
export function cityLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return CITY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "EDUCATION",    label: "Education" },
  { value: "HEALTH",       label: "Health" },
  { value: "ENVIRONMENT",  label: "Environment" },
  { value: "ANIMAL_WELFARE", label: "Animal Welfare" },
  { value: "SOCIAL",       label: "Social" },
  { value: "OTHER",        label: "Other" },
];

/** Raw enum values — useful for filter arrays. */
export const CATEGORY_VALUES = CATEGORY_OPTIONS.map((c) => c.value);

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return CATEGORY_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

// ─── Days ─────────────────────────────────────────────────────────────────────

export const DAY_OPTIONS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type DayValue = (typeof DAY_OPTIONS)[number];

/** Abbreviated display names for availability day toggles. */
export const DAY_SHORT: Record<string, string> = {
  MONDAY:    "Mon",
  TUESDAY:   "Tue",
  WEDNESDAY: "Wed",
  THURSDAY:  "Thu",
  FRIDAY:    "Fri",
  SATURDAY:  "Sat",
  SUNDAY:    "Sun",
};

// ─── Application status ────────────────────────────────────────────────────────

export interface StatusEntry {
  label: string;
  badge: string;
  dot:   string;
}

export const APPLICATION_STATUS: Record<string, StatusEntry> = {
  PENDING: {
    label:  "Pending",
    badge:  "bg-amber-50 text-amber-700 border border-amber-200",
    dot:    "bg-amber-400",
  },
  APPROVED: {
    label:  "Approved",
    badge:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot:    "bg-emerald-500",
  },
  DECLINED: {
    label:  "Declined",
    badge:  "bg-red-50 text-red-600 border border-red-200",
    dot:    "bg-red-400",
  },
};

// ─── Opportunity status ────────────────────────────────────────────────────────

export const OPPORTUNITY_STATUS: Record<string, StatusEntry> = {
  OPEN: {
    label:  "Open",
    badge:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot:    "bg-emerald-500",
  },
  FULL: {
    label:  "Full",
    badge:  "bg-blue-50 text-blue-700 border border-blue-200",
    dot:    "bg-blue-500",
  },
  ENDED: {
    label:  "Ended",
    badge:  "bg-slate-100 text-slate-600 border border-slate-200",
    dot:    "bg-slate-400",
  },
  CANCELLED: {
    label:  "Cancelled",
    badge:  "bg-red-50 text-red-600 border border-red-200",
    dot:    "bg-red-400",
  },
  CLOSED: {
    label:  "Closed",
    badge:  "bg-gray-100 text-gray-600 border border-gray-200",
    dot:    "bg-gray-400",
  },
};
