'use client';
import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";

export interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
}

export default function CustomDropdown({ value, onChange, options, className = "" }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isDefault = !selected || selected.value === options[0]?.value;

  return (
    <div ref={ref} className={`relative ${className}`}>
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
        <span className={isDefault ? "text-gray-500" : "text-gray-900 font-medium"}>
          {selected?.label ?? options[0]?.label}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="
          absolute z-50 left-0 mt-1.5 min-w-full
          bg-white border border-gray-200 rounded-xl shadow-lg
          ring-1 ring-black/5 overflow-hidden
        ">
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`
                    flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors cursor-pointer
                    ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}
                  `}
                >
                  <span>{opt.label}</span>
                  {isSelected && <CheckIcon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}