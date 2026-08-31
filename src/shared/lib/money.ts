import { MINOR_PER_MAJOR } from "@/shared/domain/expense";

export function rupeesToMinor(value: string | number): number {
  const n = typeof value === "number" ? value : Number(String(value).replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * MINOR_PER_MAJOR);
}

export function formatInr(amountMinor: number): string {
  const sign = amountMinor < 0 ? "-" : "";
  const abs = Math.abs(amountMinor);
  const major = Math.floor(abs / MINOR_PER_MAJOR);
  const minor = abs % MINOR_PER_MAJOR;
  const grouped = major.toLocaleString("en-IN");
  return `${sign}₹${grouped}.${String(minor).padStart(2, "0")}`;
}

export function parseAmountToMinor(raw: string): number {
  const t = raw.trim();
  if (!t) throw new Error("Amount required");
  return rupeesToMinor(t);
}
