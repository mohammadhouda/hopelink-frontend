import RolesPermissions from "../settings/RolesPermissions";

export default function RolesPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">Create and manage dynamic roles with granular permissions.</p>
      </div>
      <RolesPermissions />
    </div>
  );
}
