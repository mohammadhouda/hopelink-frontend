export function getAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // If it's already a full URL (new uploads store full public URL), return as-is
  if (path.startsWith("http")) return path;
  // Legacy: relative path stored without base URL — reconstruct from logos bucket
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
}
