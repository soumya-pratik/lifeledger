import { z } from "zod";
import type { ExpenseDraft, PaymentMethod } from "@/shared/domain/expense";
import { newId } from "@/shared/lib/id";

export { type MonthReviewResult, type MonthSummary } from "@/shared/domain/monthReview";

export const expenseDraftSchema = z.object({
  id: z.string(),
  ledgerId: z.string(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().nullable(),
  note: z.string(),
  paymentMethod: z.enum(["upi", "card", "cash", "other"]),
  origin: z.literal("statement"),
  importBatchId: z.string().optional(),
  fingerprint: z.string().optional(),
  rawDescription: z.string().optional(),
  bankTxnId: z.string().optional(),
});

export function parseDrafts(raw: unknown, fallback: { ledgerId: string; importBatchId: string }): ExpenseDraft[] {
  if (!Array.isArray(raw)) return [];
  const out: ExpenseDraft[] = [];
  for (const item of raw) {
    const rec = (item ?? {}) as Record<string, unknown>;
    const parsed = expenseDraftSchema.safeParse({
      currency: "INR",
      paymentMethod: "other" satisfies PaymentMethod,
      note: "",
      categoryId: null,
      ...rec,
      id: typeof rec.id === "string" && rec.id ? rec.id : newId(),
      ledgerId: fallback.ledgerId,
      importBatchId: fallback.importBatchId,
      origin: "statement",
    });
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}
