import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { createGroup } from "@/features/splits/api";
import type { SplitGroupKind } from "@/features/splits/types";
import { PageHeader, PrimaryButton, Surface } from "@/shared/ui/chrome";

const KINDS: SplitGroupKind[] = ["home", "trip", "couple", "other"];

export function NewGroupPage() {
  const { userId } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SplitGroupKind>("home");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const g = await createGroup({ name, kind, userId });
      navigate(`/splits/groups/${g.id}`);
    } catch (err) {
      // #region agent log
      fetch("http://127.0.0.1:7276/ingest/9e733f63-913b-4a5e-ab8d-47371ed54f20", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "db2b60" },
        body: JSON.stringify({
          sessionId: "db2b60",
            runId: "post-fix",
          hypothesisId: "H4",
          location: "src/features/splits/screens/NewGroupPage.tsx:onSubmit",
          message: "create group caught",
          data: { errMessage: err instanceof Error ? err.message : String(err) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setError(err instanceof Error ? err.message : "Could not create group");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Splits" title="New group" description="Invite people after you create it. They must already have a LifeLedger account." />
      <Surface as="form" onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block text-xs text-ll-muted">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm text-ll-text"
            placeholder="Goa trip"
          />
        </label>
        <label className="block text-xs text-ll-muted">
          Type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SplitGroupKind)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm text-ll-danger">{error}</p> : null}
        <PrimaryButton type="submit" disabled={busy || !name.trim()}>
          {busy ? "Creating…" : "Create group"}
        </PrimaryButton>
      </Surface>
    </div>
  );
}
