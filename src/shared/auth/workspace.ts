import { db } from "@/shared/db/dexie";
import { DEFAULT_CATEGORIES, type Ledger } from "@/shared/domain/ledger";
import { newId } from "@/shared/lib/id";

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
  const existing = await db.session.get("current");
  if (existing?.userId === profile.userId) {
    const ledger = await db.ledgers.get(existing.activeLedgerId);
    if (ledger && ledger.createdBy === profile.userId) {
      const ledgers = (await db.ledgers.toArray()).filter((l) => l.createdBy === profile.userId);
      await db.session.put({
        ...existing,
        email: profile.email,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
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
  }

  const owned = (await db.ledgers.toArray()).filter((l) => l.createdBy === profile.userId);
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
          archivedAt: null,
        })),
      );
    });
  }

  const ledgers = (await db.ledgers.toArray()).filter((l) => l.createdBy === profile.userId);
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
