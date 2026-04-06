"use client";
/**
 * Admin-portal dropdown — blue theme, shows a check on the selected item.
 * Re-exports DropdownOption so callers don't need to change their imports.
 */
import SharedDropdown, { type DropdownProps } from "@/components/ui/Dropdown";
export type { DropdownOption } from "@/components/ui/Dropdown";

type CustomDropdownProps = Pick<DropdownProps, "value" | "onChange" | "options" | "className">;

export default function CustomDropdown(props: CustomDropdownProps) {
  return <SharedDropdown {...props} theme="blue" showCheck />;
}
