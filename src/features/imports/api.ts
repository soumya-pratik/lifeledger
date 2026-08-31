import { db, type ImportBatchRow } from "@/shared/db/dexie";
import type { Category } from "@/shared/domain/ledger";
import { proposeImported } from "@/features/expenses/api";
import { parseCsvStatement } from "@/features/imports/parseCsv";
import { llmAdapter } from "@/features/imports/llm";
import type { MonthReviewResult, MonthSummary } from "@/shared/domain/monthReview";
import { newId } from "@/shared/lib/id";

export async function importStatementFile(input: {
  userId: string;
  ledgerId: string;
  file: File;
  categories: Category[];
  useLlmFallback: boolean;
}): Promise<{ batch: ImportBatchRow; created: number; skipped: number; warnings: string[] }> {
  const text = await input.file.text();
  const batchId = newId();
  const parsed = await parseCsvStatement({
    text,
    ledgerId: input.ledgerId,
    importBatchId: batchId,
    categories: input.categories,
  });
  let extractor: ImportBatchRow["extractor"] = "csv";
  let { drafts, warnings } = parsed;

  if (drafts.length === 0 && input.useLlmFallback) {
    extractor = "llm";
    drafts = await llmAdapter.extractTransactions(text, {
      ledgerId: input.ledgerId,
      importBatchId: batchId,
    });
    drafts = drafts.map((d) => ({ ...d, importBatchId: batchId, origin: "statement" as const }));
  }

  const batch: ImportBatchRow = {
    id: batchId,
    ledgerId: input.ledgerId,
    filename: input.file.name,
    extractor,
    status: "parsed",
    reviewText: null,
    createdBy: input.userId,
    createdAt: new Date().toISOString(),
  };
  await db.importBatches.add(batch);

  const { created, skippedFingerprints } = await proposeImported(
    input.userId,
    drafts.map((d) => ({ ...d, importBatchId: batchId })),
  );

  return {
    batch,
    created: created.length,
    skipped: skippedFingerprints.length,
    warnings,
  };
}

export async function listBatches(ledgerId: string): Promise<ImportBatchRow[]> {
  const rows = await db.importBatches.where("ledgerId").equals(ledgerId).toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function reviewMonthWithLlm(summary: MonthSummary): Promise<MonthReviewResult> {
  return llmAdapter.reviewMonth(summary);
}
