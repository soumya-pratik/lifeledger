import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { listAllUserBalances, listGroups } from "@/features/splits/api";
import type { SplitGroup } from "@/features/splits/types";
import { formatInr } from "@/shared/lib/money";
import { PageHeader, PrimaryButton, Surface } from "@/shared/ui/chrome";

export function SplitsHomePage() {
  const { userId } = useSession();
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [net, setNet] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [g, balances] = await Promise.all([listGroups(), listAllUserBalances(userId)]);
        setGroups(g);
        setNet(balances.reduce((a, b) => a + b.net, 0));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load Splits. Apply the 004 migration in Supabase.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Splits"
        title="Bills with people"
        description="Groups, balances, and settle up. Separate from your personal expense tracker."
        actions={
          <Link to="/splits/groups/new">
            <PrimaryButton>New group</PrimaryButton>
          </Link>
        }
      />

      <Surface>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ll-muted">Your net</p>
        <p className={`mt-2 text-2xl font-semibold tabular-nums ${net >= 0 ? "text-ll-success" : "text-ll-danger"}`}>
          {net >= 0 ? `${formatInr(net)} owed to you` : `You owe ${formatInr(-net)}`}
        </p>
      </Surface>

      {error ? <p className="text-sm text-ll-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-ll-muted">Loading…</p> : null}

      <ul className="space-y-3">
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              to={`/splits/groups/${g.id}`}
              className="block rounded-2xl border border-ll-border bg-ll-surface p-5 shadow-[var(--ll-shadow)] hover:border-ll-accent"
            >
              <p className="font-semibold">{g.name}</p>
              <p className="mt-1 text-xs capitalize text-ll-muted">
                {g.kind} · {g.currency}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {!loading && groups.length === 0 && !error ? (
        <p className="text-sm text-ll-muted">No groups yet. Create one to split a bill.</p>
      ) : null}
    </div>
  );
}
