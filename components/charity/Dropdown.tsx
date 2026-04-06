"use client";
/**
 * Charity-portal dropdown — emerald theme, supports placeholder / disabled / triggerClassName.
 * Re-exports DropdownOption so callers don't need to change their imports.
 */
import SharedDropdown, { type DropdownProps } from "@/components/ui/Dropdown";
export type { DropdownOption } from "@/components/ui/Dropdown";

type CharityDropdownProps = Omit<DropdownProps, "theme" | "showCheck">;

export default function Dropdown(props: CharityDropdownProps) {
  return <SharedDropdown {...props} theme="emerald" />;
}
