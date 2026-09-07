import { db } from "@/shared/db/dexie";
import { DEFAULT_CATEGORIES, type Ledger } from "@/shared/domain/ledger";
import { newId } from "@/shared/lib/id";
import { renameRentToHouseEmi } from "@/features/expenses/api";

let workspaceChain: Promise<unknown> = Promise.resolve();

function enqueueWorkspace<T>(fn: () => Promise<T>): Promise<T> {
  const run = workspaceChain.then(fn, fn);
  workspaceChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ledgerWeight(ledgerId: string): Promise<number> {
  const expenses = await db.expenses
    .where("ledgerId")
    .equals(ledgerId)
    .filter((e) => e.deletedAt == null)
    .count();
  const incomes = await db.incomes.where("ledgerId").equals(ledgerId).count();
  const proposals = await db.proposals.where("ledgerId").equals(ledgerId).count();
  return expenses * 1_000 + incomes * 100 + proposals;
}

async function deleteLedgerData(ledgerId: string): Promise<void> {
  await db.transaction("rw", [db.expenses, db.incomes, db.proposals, db.importBatches, db.categories, db.members, db.ledgers], async () => {
    await db.expenses.where("ledgerId").equals(ledgerId).delete();
    await db.incomes.where("ledgerId").equals(ledgerId).delete();
    await db.proposals.where("ledgerId").equals(ledgerId).delete();
    await db.importBatches.where("ledgerId").equals(ledgerId).delete();
    await db.categories.where("ledgerId").equals(ledgerId).delete();
    await db.members.where("ledgerId").equals(ledgerId).delete();
    await db.ledgers.delete(ledgerId);
  });
}

/** One personal book per user on this device. Keeps the ledger with the most data. */
async function keepSingleLedger(userId: string, preferredId: string | undefined): Promise<Ledger[]> {
  const owned = (await db.ledgers.toArray()).filter((l) => l.createdBy === userId);
  if (owned.length <= 1) return owned;

  const scored = await Promise.all(
    owned.map(async (l) => ({ ledger: l, weight: await ledgerWeight(l.id) })),
  );
  scored.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    if (preferredId && a.ledger.id === preferredId) return -1;
    if (preferredId && b.ledger.id === preferredId) return 1;
    return a.ledger.createdAt.localeCompare(b.ledger.createdAt);
  });
  const keep = scored[0].ledger;
  for (const row of scored.slice(1)) {
    await deleteLedgerData(row.ledger.id);
  }
  return [keep];
}

export type AuthProfile = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function ensureUserWorkspace(profile: AuthProfile): Promise<{
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  ledger: Ledger;
  ledgers: Ledger[];
}> {
  return enqueueWorkspace(() => ensureUserWorkspaceInner(profile));
}

async function ensureUserWorkspaceInner(profile: AuthProfile): Promise<{
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  ledger: Ledger;
  ledgers: Ledger[];
}> {
  await renameRentToHouseEmi();
  const existing = await db.session.get("current");
  const preferredId =
    existing?.userId === profile.userId ? existing.activeLedgerId : undefined;
  const owned = await keepSingleLedger(profile.userId, preferredId);
  let ledger = owned.find((l) => l.kind === "personal") ?? owned[0];

  if (!ledger) {
    const ledgerId = newId();
    const now = new Date().toISOString();
    ledger = {
      id: ledgerId,
      name: "Personal",
      kind: "personal",
      currency: "INR",
      createdBy: profile.userId,
      createdAt: now,
      updatedAt: now,
    };
    await db.transaction("rw", db.ledgers, db.members, db.categories, async () => {
      await db.ledgers.add(ledger!);
      await db.members.add({
        ledgerId,
        userId: profile.userId,
        role: "owner",
        status: "active",
      });
      await db.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((c) => ({
          id: newId(),
          ledgerId,
          name: c.name,
          kind: c.kind,
          icon: c.icon,
          archivedAt: null,
        })),
      );
    });
  }

  const ledgers = await keepSingleLedger(profile.userId, ledger.id);
  ledger = ledgers[0] ?? ledger;
  await db.session.put({
    id: "current",
    userId: profile.userId,
    email: profile.email,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    activeLedgerId: ledger.id,
  });

  return {
    userId: profile.userId,
    email: profile.email,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    ledger,
    ledgers,
  };
}

export async function setActiveLedger(ledgerId: string): Promise<void> {
  const session = await db.session.get("current");
  if (!session) return;
  await db.session.put({ ...session, activeLedgerId: ledgerId });
}

export async function clearLocalSession(): Promise<void> {
  await db.session.delete("current");
}
