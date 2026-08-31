import Papa from "papaparse";
import type { Category } from "@/shared/domain/ledger";
import type { ExpenseDraft } from "@/shared/domain/expense";
import { parseLooseDate } from "@/shared/lib/dates";
import { rupeesToMinor } from "@/shared/lib/money";
import { newId } from "@/shared/lib/id";
import { expenseFingerprint } from "@/shared/lib/fingerprint";

export type ParseResult = {
  drafts: ExpenseDraft[];
  extractor: "csv";
  warnings: string[];
};

function pick(row: Record<string, string>, names: string[]): string {
  const keys = Object.keys(row);
  for (const name of names) {
    const hit = keys.find((k) => k.trim().toLowerCase() === name);
    if (hit && row[hit]?.trim()) return row[hit].trim();
  }
  return "";
}

function guessCategory(description: string, categories: Category[]): string | null {
  const d = description.toLowerCase();
  const rules: [string[], string][] = [
    [["swiggy", "zomato", "restaurant", "cafe", "dominos"], "Food"],
    [["uber", "ola", "metro", "irctc", "petrol", "fuel"], "Transport"],
    [["rent"], "Rent"],
    [["electric", "bescom", "airtel", "jio", "wifi", "gas"], "Utilities"],
    [["pharmacy", "apollo", "hospital", "clinic"], "Health"],
    [["neft", "imps", "own a/c", "self"], "Transfer"],
  ];
  for (const [needles, name] of rules) {
    if (needles.some((n) => d.includes(n))) {
      return categories.find((c) => c.name === name)?.id ?? null;
    }
  }
  return categories.find((c) => c.name === "Other")?.id ?? null;
}

export async function parseCsvStatement(input: {
  text: string;
  ledgerId: string;
  importBatchId: string;
  categories: Category[];
}): Promise<ParseResult> {
  const warnings: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(input.text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    warnings.push(`CSV notes: ${parsed.errors.slice(0, 3).map((e) => e.message).join("; ")}`);
  }

  const drafts: ExpenseDraft[] = [];
  for (const row of parsed.data) {
    const dateRaw = pick(row, ["date", "txn date", "transaction date", "value date", "spent_on"]);
    const spentOn = parseLooseDate(dateRaw);
    const desc = pick(row, ["description", "narration", "remarks", "particulars", "note"]);
    const debitRaw = pick(row, ["debit", "withdrawal", "withdrawals", "amount"]);
    const creditRaw = pick(row, ["credit", "deposit", "deposits"]);

    if (!spentOn) {
      warnings.push(`Skipped row without a date: ${desc || dateRaw || "?"}`);
      continue;
    }

    let amountMinor: number | null = null;
    let isSpend = true;
    try {
      if (debitRaw && Number(debitRaw.replace(/[,₹\s]/g, "")) > 0) {
        amountMinor = rupeesToMinor(debitRaw);
        isSpend = true;
      } else if (creditRaw && Number(creditRaw.replace(/[,₹\s]/g, "")) > 0) {
        amountMinor = rupeesToMinor(creditRaw);
        isSpend = false;
      }
    } catch {
      warnings.push(`Bad amount on ${spentOn}: ${debitRaw || creditRaw}`);
      continue;
    }

    if (amountMinor == null || amountMinor <= 0) continue;
    if (!isSpend) continue;

    const rawDescription = desc || "Imported";
    const fingerprint = await expenseFingerprint({
      ledgerId: input.ledgerId,
      spentOn,
      amountMinor,
      rawDescription,
    });

    drafts.push({
      id: newId(),
      ledgerId: input.ledgerId,
      amountMinor,
      currency: "INR",
      spentOn,
      categoryId: guessCategory(rawDescription, input.categories),
      note: rawDescription.slice(0, 120),
      paymentMethod: /upi/i.test(rawDescription) ? "upi" : "other",
      origin: "statement",
      importBatchId: input.importBatchId,
      fingerprint,
      rawDescription,
    });
  }

  return { drafts, extractor: "csv", warnings };
}
