'use client';
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ── helpers ──────────────────────────────────────────────── */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** "2025-03-09" → "Mar 9, 2025" */
function formatDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`;
}

/** Build calendar grid for a given month/year */
function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean; iso: string }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ day: d, current: false, iso: `${py}-${pad(pm + 1)}-${pad(d)}` });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, iso: `${year}-${pad(month + 1)}-${pad(d)}` });
  }

  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ day: d, current: false, iso: `${ny}-${pad(nm + 1)}-${pad(d)}` });
  }

  return cells;
}

/* ── component ────────────────────────────────────────────── */
interface CustomDatePickerProps {
  value: string;              
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Calendar navigation state
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() =>
    value ? Number(value.split("-")[0]) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(() =>
    value ? Number(value.split("-")[1]) - 1 : today.getMonth()
  );

  // Sync calendar view when value changes externally
  useEffect(() => {
    if (value) {
      setViewYear(Number(value.split("-")[0]));
      setViewMonth(Number(value.split("-")[1]) - 1);
    }
  }, [value]);

  // Click-outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function selectDate(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-between gap-2 w-full
          px-3 py-2 text-sm rounded-lg border transition-all outline-none cursor-pointer
          ${open
            ? "border-blue-400 bg-white ring-2 ring-blue-100 text-gray-900 shadow-sm"
            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white hover:shadow-sm"
          }
        `}
      >
        <span className={value ? "text-gray-900 font-medium" : "text-gray-500"}>
          {value ? formatDisplay(value) : placeholder}
        </span>

        <span className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clear}
              className="p-0.5 rounded hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-3 w-3 text-gray-400" />
            </span>
          )}
          <ChevronDownIcon
            className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {/* ── Calendar popup ── */}
      {open && (
        <div className="
          absolute z-50 left-0 mt-1.5
          w-70 bg-white border border-gray-200 rounded-xl shadow-lg
          ring-1 ring-black/5 overflow-hidden
        ">
          {/* Month / Year header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <button
              type="button" onClick={prevMonth}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
            </button>

            <button
              type="button" onClick={goToday}
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </button>

            <button
              type="button" onClick={nextMonth}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 px-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 px-2 pb-2">
            {cells.map((cell, i) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === todayIso;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDate(cell.iso)}
                  className={`
                    relative h-8 w-full text-xs rounded-lg transition-all cursor-pointer
                    ${!cell.current ? "text-gray-300" : "text-gray-700"}
                    ${isSelected
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : isToday
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : cell.current
                          ? "hover:bg-gray-100"
                          : "hover:bg-gray-50"
                    }
                  `}
                >
                  {cell.day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer shortcuts */}
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={() => { selectDate(todayIso); }}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}