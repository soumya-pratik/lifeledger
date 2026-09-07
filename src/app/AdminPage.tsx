import { useEffect, useState } from "react";
import { adminListUsers, adminSetModules, adminSetRole, type AdminUserRow } from "@/shared/entitlements/adminApi";
import { TOGGLEABLE_MODULES, type UserRole } from "@/shared/entitlements/types";
import { PageHeader, Surface } from "@/shared/ui/chrome";

export function AdminPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const rows = await adminListUsers();
    setUsers(rows);
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : "Could not load users. Run 005_admin_roles.sql."));
  }, []);

  async function onRole(user: AdminUserRow, role: UserRole) {
    setBusyId(user.userId);
    setError(null);
    try {
      const result = await adminSetRole(user.userId, role);
      if (!result.ok && result.error === "last_admin") {
        setError("Keep at least one admin.");
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onToggle(user: AdminUserRow, moduleId: string, on: boolean) {
    setBusyId(user.userId);
    setError(null);
    const next = on
      ? [...new Set([...user.modules, moduleId])]
      : user.modules.filter((m) => m !== moduleId);
    try {
      await adminSetModules(user.userId, next);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Module update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Admin"
        title="Users"
        description="People who have signed in. Admins get every module. For User, choose Expenses and Splits."
      />
      {error ? <p className="text-sm text-ll-danger">{error}</p> : null}
      <Surface className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-ll-border text-xs uppercase tracking-wide text-ll-muted">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Modules</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-ll-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.displayName || "—"}</p>
                  <p className="text-xs text-ll-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={busyId === u.userId}
                    onChange={(e) => void onRole(u, e.target.value as UserRole)}
                    className="rounded-lg border border-ll-border bg-ll-bg px-2 py-1 text-sm"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.role === "admin" ? (
                    <span className="text-xs text-ll-muted">All modules</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {TOGGLEABLE_MODULES.map((m) => (
                        <label key={m} className="flex items-center gap-2 text-xs capitalize">
                          <input
                            type="checkbox"
                            checked={u.modules.includes(m)}
                            disabled={busyId === u.userId}
                            onChange={(e) => void onToggle(u, m, e.target.checked)}
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ll-muted">
                  {u.updatedAt ? new Date(u.updatedAt).toLocaleString("en-IN") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !error ? (
          <p className="px-4 py-6 text-sm text-ll-muted">No profiles yet. Apply 005 and have people sign in.</p>
        ) : null}
      </Surface>
    </div>
  );
}
