"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

export interface DropdownOption {
  value: string;
  label: string;
}

export type DropdownTheme = "blue" | "emerald";

const THEME: Record<DropdownTheme, { open: string; item: string; check: string }> = {
  blue: {
    open: "bg-white border-blue-400 ring-2 ring-blue-100",
    item: "bg-blue-50 text-blue-700 font-medium",
    check: "text-blue-600",
  },
  emerald: {
    open: "bg-white border-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.15)]",
    item: "bg-emerald-50 text-emerald-700 font-medium",
    check: "text-emerald-600",
  },
};

export interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Override the trigger button's className entirely */
  triggerClassName?: string;
  theme?: DropdownTheme;
  showCheck?: boolean;
}

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className = "",
  triggerClassName,
  theme = "blue",
  showCheck = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = THEME[theme];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const defaultTrigger = [
    "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border rounded-lg outline-none transition-all text-left",
    open ? t.open : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
  ].join(" ");

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className={triggerClassName ?? defaultTrigger}
      >
        <span className={selected ? "text-gray-900" : "text-gray-500"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-[60] mt-1.5 left-0 min-w-full bg-white border border-gray-200 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden">
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                    isSelected ? t.item : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {showCheck && isSelected && (
                    <CheckIcon className={`h-3.5 w-3.5 shrink-0 ${t.check}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
