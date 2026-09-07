import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import {
  createSettlement,
  getGroup,
  inviteMember,
  listExpenses,
  listMembers,
  listSettlements,
  memberLabel,
} from "@/features/splits/api";
import { balancesForUser, computePairBalances } from "@/features/splits/balances";
import type { SplitExpense, SplitGroup, SplitMember, SplitSettlement } from "@/features/splits/types";
import { todayIsoDate } from "@/shared/lib/dates";
import { formatInr, parseAmountToMinor } from "@/shared/lib/money";
import { GhostButton, PageHeader, PrimaryButton, Surface } from "@/shared/ui/chrome";

export function GroupDetailPage() {
  const { id } = useParams();
  const { userId } = useSession();
  const [group, setGroup] = useState<SplitGroup | null>(null);
  const [members, setMembers] = useState<SplitMember[]>([]);
  const [expenses, setExpenses] = useState<SplitExpense[]>([]);
  const [settlements, setSettlements] = useState<SplitSettlement[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [fromUser, setFromUser] = useState(userId);
  const [toUser, setToUser] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");

  async function reload() {
    if (!id) return;
    const [g, m, e, s] = await Promise.all([
      getGroup(id),
      listMembers(id),
      listExpenses(id),
      listSettlements(id),
    ]);
    setGroup(g);
    setMembers(m);
    setExpenses(e);
    setSettlements(s);
    if (!toUser && m.find((x) => x.userId !== userId)) {
      setToUser(m.find((x) => x.userId !== userId)!.userId);
    }
  }

  useEffect(() => {
    void reload().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [id]);

  const nameById = useMemo(() => {
    const map = new Map(members.map((m) => [m.userId, memberLabel(m, userId)]));
    return (uid: string) => map.get(uid) ?? uid.slice(0, 8);
  }, [members, userId]);

  const pairs = useMemo(
    () =>
      computePairBalances(
        expenses.map((e) => ({
          id: e.id,
          payerId: e.payerId,
          amountMinor: e.amountMinor,
          deletedAt: e.deletedAt,
          shares: e.shares,
        })),
        settlements.map((s) => ({ fromUser: s.fromUser, toUser: s.toUser, amountMinor: s.amountMinor })),
      ),
    [expenses, settlements],
  );
  const mine = balancesForUser(pairs, userId);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setInviteMsg(null);
    try {
      const result = await inviteMember(id, inviteEmail);
      if (result.ok) {
        setInviteEmail("");
        setInviteMsg("Added to the group.");
        await reload();
      } else if (result.error === "not_signed_up") {
        setInviteMsg("They need to sign up for LifeLedger with that Gmail first.");
      } else {
        setInviteMsg("Could not invite.");
      }
    } catch (err) {
      setInviteMsg(err instanceof Error ? err.message : "Could not invite.");
    }
  }

  async function onSettle(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    try {
      await createSettlement({
        groupId: id,
        userId,
        fromUser,
        toUser,
        amountMinor: parseAmountToMinor(settleAmount),
        spentOn: todayIsoDate(),
        note: settleNote,
      });
      setSettleAmount("");
      setSettleNote("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settle failed");
    }
  }

  if (!id) return null;
  if (!group && !error) return <p className="text-sm text-ll-muted">Loading…</p>;
  if (!group) return <p className="text-sm text-ll-danger">{error ?? "Group not found"}</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Splits"
        title={group.name}
        description={`${group.kind} · ${members.length} people`}
        actions={
          <Link to={`/splits/groups/${id}/expenses/new`}>
            <PrimaryButton>Add bill</PrimaryButton>
          </Link>
        }
      />

      <Surface>
        <h2 className="text-sm font-semibold">Balances</h2>
        {mine.youOwe.length === 0 && mine.owedToYou.length === 0 ? (
          <p className="mt-2 text-sm text-ll-muted">All settled in this group.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {mine.youOwe.map((p) => (
              <li key={`${p.fromUser}-${p.toUser}`}>
                You owe {nameById(p.toUser)} <span className="tabular-nums text-ll-danger">{formatInr(p.amountMinor)}</span>
              </li>
            ))}
            {mine.owedToYou.map((p) => (
              <li key={`${p.fromUser}-${p.toUser}`}>
                {nameById(p.fromUser)} owes you{" "}
                <span className="tabular-nums text-ll-success">{formatInr(p.amountMinor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface as="form" onSubmit={(e) => void onInvite(e)} className="space-y-3">
        <h2 className="text-sm font-semibold">Invite member</h2>
        <p className="text-xs text-ll-muted">They must already have signed in to LifeLedger with this Gmail.</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@gmail.com"
            className="min-w-48 flex-1 rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
          />
          <GhostButton type="submit">Invite</GhostButton>
        </div>
        {inviteMsg ? <p className="text-xs text-ll-muted">{inviteMsg}</p> : null}
        <ul className="text-sm text-ll-muted">
          {members.map((m) => (
            <li key={m.userId}>
              {memberLabel(m, userId)}
              {m.role === "owner" ? " · owner" : ""}
            </li>
          ))}
        </ul>
      </Surface>

      <Surface as="form" onSubmit={(e) => void onSettle(e)} className="space-y-3">
        <h2 className="text-sm font-semibold">Settle up</h2>
        <p className="text-xs text-ll-muted">Records a payment between two people. Not a shared bill.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-ll-muted">
            From
            <select
              value={fromUser}
              onChange={(e) => setFromUser(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {memberLabel(m, userId)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ll-muted">
            To
            <select
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
            >
              {members
                .filter((m) => m.userId !== fromUser)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {memberLabel(m, userId)}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label className="block text-xs text-ll-muted">
          Amount (₹)
          <input
            required
            inputMode="decimal"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs text-ll-muted">
          Note
          <input
            value={settleNote}
            onChange={(e) => setSettleNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-ll-border bg-ll-bg px-3 py-2 text-sm"
          />
        </label>
        {error ? <p className="text-sm text-ll-danger">{error}</p> : null}
        <PrimaryButton type="submit" disabled={!toUser}>
          Record payment
        </PrimaryButton>
      </Surface>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-sm text-ll-muted">No bills yet.</p>
        ) : (
          <ul className="divide-y divide-ll-border overflow-hidden rounded-2xl border border-ll-border bg-ll-surface">
            {expenses.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{e.description}</p>
                  <p className="tabular-nums text-sm">{formatInr(e.amountMinor)}</p>
                </div>
                <p className="text-xs text-ll-muted">
                  {e.spentOn} · paid by {nameById(e.payerId)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
