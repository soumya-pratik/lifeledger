import { useEffect, useState, type FormEvent } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { listCategories } from "@/features/expenses/api";
import { importStatementFile, listBatches } from "@/features/imports/api";
import type { ImportBatchRow } from "@/shared/db/dexie";
import { hasLlmKey } from "@/features/imports/llm";

export function ImportPage() {
  const { userId, ledger } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [useLlm, setUseLlm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [batches, setBatches] = useState<ImportBatchRow[]>([]);

  async function reload() {
    setBatches(await listBatches(ledger.id));
  }

  useEffect(() => {
    void reload();
  }, [ledger.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage(null);
    setWarnings([]);
    try {
      const categories = await listCategories(ledger.id);
      const result = await importStatementFile({
        userId,
        ledgerId: ledger.id,
        file,
        categories,
        useLlmFallback: useLlm,
      });
      setMessage(
        `Parsed with ${result.batch.extractor}: ${result.created} proposed, ${result.skipped} already in the ledger.`,
      );
      setWarnings(result.warnings);
      setFile(null);
      await reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-2xl border border-ll-border bg-ll-surface p-4">
        <div>
          <h2 className="text-sm font-semibold">Upload statement</h2>
          <p className="mt-1 text-xs text-ll-muted">
            CSV first (headers like Date, Debit, Narration). Credits are ignored so deposits do not
            become expenses. Rows land as proposals on the Ledger tab → From bank statements.
          </p>
        </div>
        <input
          type="file"
          accept=".csv,text/csv,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ll-muted file:mr-3 file:rounded-full file:border-0 file:bg-ll-bg file:px-3 file:py-1.5 file:text-ll-text"
        />
        <label className="flex items-start gap-2 text-xs text-ll-muted">
          <input
            type="checkbox"
            checked={useLlm}
            onChange={(e) => setUseLlm(e.target.checked)}
            className="mt-0.5"
          />
          If CSV yields zero spends, try LLM extract (BYOK, redacted text, still confirm on Ledger).
        </label>
        {useLlm && !hasLlmKey() ? (
          <p className="text-xs text-ll-warn">No LLM key yet — add one under Settings.</p>
        ) : null}
        <button
          disabled={!file || busy}
          className="w-full rounded-xl bg-ll-accent py-2.5 text-sm font-semibold text-ll-accent-fg disabled:opacity-40"
        >
          {busy ? "Parsing…" : "Import into this ledger"}
        </button>
        {message ? <p className="text-sm text-ll-text">{message}</p> : null}
        {warnings.length > 0 ? (
          <ul className="list-disc pl-4 text-xs text-ll-muted">
            {warnings.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </form>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Recent batches</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-ll-muted">None yet.</p>
        ) : (
          <ul className="divide-y divide-ll-border overflow-hidden rounded-2xl border border-ll-border bg-ll-surface">
            {batches.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm">
                <p className="text-ll-text">{b.filename}</p>
                <p className="text-xs text-ll-muted">
                  {b.extractor} · {b.status} · {new Date(b.createdAt).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
