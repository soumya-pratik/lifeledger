function normalizeDescription(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[^A-Z0-9 @._-]/g, "")
    .trim();
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expenseFingerprint(input: {
  ledgerId: string;
  spentOn: string;
  amountMinor: number;
  rawDescription: string;
  bankTxnId?: string;
}): Promise<string> {
  const desc = normalizeDescription(input.rawDescription);
  const key = [
    input.ledgerId,
    input.spentOn,
    String(input.amountMinor),
    desc,
    input.bankTxnId ?? "",
  ].join("|");
  return sha256Hex(key);
}

export function redactForLlm(text: string): string {
  return text
    .replace(/\b\d{9,18}\b/g, "[account]")
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[card]")
    .replace(/[a-zA-Z0-9._-]+@[a-zA-Z0-9]+/g, "[vpa]");
}
