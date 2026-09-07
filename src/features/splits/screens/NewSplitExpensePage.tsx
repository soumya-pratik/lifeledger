import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { createExpense, listMembers, memberLabel } from "@/features/splits/api";
import { allocateShares, type SplitMode } from "@/features/splits/splitMath";
import type { SplitMember } from "@/features/splits/types";
import { todayIsoDate } from "@/shared/lib/dates";
import { parseAmountToMinor } from "@/shared/lib/money";
import { PageHeader, PrimaryButton, Surface } from "@/shared/ui/chrome";

export function NewSplitExpensePage() {
  const { id: groupId } = useParams();
  const { userId } = useSession();
  const navigate = useNavigate();
  const [members, setMembers] = useState<SplitMember[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState(todayIsoDate());
  const [payerId, setPayerId] = useState(userId);
  const [involved, setInvolved] = useState<string[]>([userId]);
  const [mode, setMode] = useState<SplitMode>("equal");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    void listMembers(groupId).then((m) => {
      setMembers(m);
      setInvolved(m.map((x) => x.userId));
      if (m.some((x) => x.userId === userId)) setPayerId(userId);
      else if (m[0]) setPayerId(m[0].userId);
    });
  }, [groupId, userId]);

  function toggleInvolved(uid: string) {
    setInvolved((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!groupId) return;
    setError(null);
    setBusy(true);
    try {
      const amountMinor = parseAmountToMinor(amount);
      const extraNums: Record<string, number> = {};
      if (mode !== "equal") {
        for (const uid of involved) {
          extraNums[uid] = Number(extra[uid] ?? (mode === "shares" ? 1 : 0));
        }
        if (mode === "exact") {
          for (const uid of involved) {
            extraNums[uid] = parseAmountToMinor(extra[uid] || "0");
          }
        }
      }
      const shares = allocateShares(amountMinor, involved, mode, extraNums);
      await createExpense({
        groupId,
        userId,
        amountMinor,
        description,
        spentOn,
        payerId,
        shares,
      });
      navigate(`/splits/groups/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save bill");
    } finally {
      setBusy(false);
    }
  }

  if (!groupId) return null;

  return (
    <div className="space-y-6">
      <PageHeader kicker="Splits" title="Add bill" description="Who paid, who is in, and how to split." />
      <Surface as="form" onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block text-xs text-ll-muted">
          Description
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
            placeholder="Dinner"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-ll-muted">
            Amount (₹)
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-xs text-ll-muted">
            Date
            <input
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
            />
          </label>
        </div>
        <label className="block text-xs text-ll-muted">
          Paid by
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {memberLabel(m, userId)}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-xs text-ll-muted">Split between</legend>
          <ul className="mt-2 space-y-1">
            {members.map((m) => (
              <li key={m.userId}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={involved.includes(m.userId)}
                    onChange={() => toggleInvolved(m.userId)}
                  />
                  {memberLabel(m, userId)}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <label className="block text-xs text-ll-muted">
          Split type
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SplitMode)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2.5 text-sm"
          >
            <option value="equal">Equally</option>
            <option value="exact">Exact amounts</option>
            <option value="shares">Shares</option>
            <option value="percent">Percent</option>
          </select>
        </label>
        {mode !== "equal"
          ? involved.map((uid) => (
              <label key={uid} className="block text-xs text-ll-muted">
                {memberLabel(members.find((m) => m.userId === uid) ?? { userId: uid, displayName: "", email: "", groupId: "", role: "member" }, userId)}{" "}
                ({mode === "exact" ? "₹" : mode === "percent" ? "%" : "shares"})
                <input
                  value={extra[uid] ?? ""}
                  onChange={(e) => setExtra((c) => ({ ...c, [uid]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
                />
              </label>
            ))
          : null}
        {error ? <p className="text-sm text-ll-danger">{error}</p> : null}
        <PrimaryButton type="submit" disabled={busy || involved.length === 0}>
          {busy ? "Saving…" : "Save bill"}
        </PrimaryButton>
      </Surface>
    </div>
  );
}
