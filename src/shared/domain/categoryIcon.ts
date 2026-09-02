export const CATEGORY_ICON_IDS = [
  "utensils",
  "cart",
  "bus",
  "car",
  "home",
  "bolt",
  "droplet",
  "heart",
  "pill",
  "arrows",
  "tag",
  "bag",
  "film",
  "dumbbell",
  "gift",
  "plane",
  "coffee",
  "paw",
  "book",
  "phone",
  "baby",
  "sparkle",
  "shirt",
  "wrench",
  "music",
  "game",
  "leaf",
  "bank",
  "shield",
  "wine",
] as const;

export type CategoryIconId = (typeof CATEGORY_ICON_IDS)[number];

export const DEFAULT_CATEGORY_ICON: CategoryIconId = "tag";

const ICON_SET = new Set<string>(CATEGORY_ICON_IDS);

export function isCategoryIconId(value: unknown): value is CategoryIconId {
  return typeof value === "string" && ICON_SET.has(value);
}

type Rule = { re: RegExp; icon: CategoryIconId };

const NAME_RULES: Rule[] = [
  { re: /food|grocer|lunch|dinner|restaurant|snack|meal|cafe|coffee|tea/, icon: "utensils" },
  { re: /coffee|cafe|tea/, icon: "coffee" },
  { re: /shop|amazon|mart|retail|store/, icon: "cart" },
  { re: /cloth|fashion|apparel|shoe/, icon: "shirt" },
  { re: /transport|uber|ola|metro|bus|train|fuel|petrol|diesel|parking/, icon: "bus" },
  { re: /car|auto|vehicle|taxi/, icon: "car" },
  { re: /rent|housing|mortgage|home|flat|apartment|emi/, icon: "home" },
  { re: /utilit|electric|power|internet|wifi|broadband/, icon: "bolt" },
  { re: /water|gas|sewage/, icon: "droplet" },
  { re: /health|hospital|doctor|clinic|medical|dental/, icon: "heart" },
  { re: /pharma|medicine|drug|pharmacy/, icon: "pill" },
  { re: /transfer|send|upi.?out|remit/, icon: "arrows" },
  { re: /entertain|movie|netflix|spotify|ott|cinema/, icon: "film" },
  { re: /gym|fitness|sport|yoga/, icon: "dumbbell" },
  { re: /gift|present|donation|charity/, icon: "gift" },
  { re: /travel|flight|hotel|trip|vacation/, icon: "plane" },
  { re: /pet|dog|cat|vet/, icon: "paw" },
  { re: /educat|school|tuition|course|book/, icon: "book" },
  { re: /phone|mobile|recharge|airtel|jio/, icon: "phone" },
  { re: /baby|kid|child|school.?fee/, icon: "baby" },
  { re: /repair|maintenance|plumber|mechanic/, icon: "wrench" },
  { re: /music|concert/, icon: "music" },
  { re: /game|gaming|steam/, icon: "game" },
  { re: /garden|plant|grocery.?veg/, icon: "leaf" },
  { re: /bank|emi|loan|insurance|tax|fee/, icon: "bank" },
  { re: /insur|protect/, icon: "shield" },
  { re: /alcohol|bar|wine|beer/, icon: "wine" },
  { re: /beauty|salon|spa|personal/, icon: "sparkle" },
  { re: /bag|amazon|order/, icon: "bag" },
];

export function heuristicCategoryIcon(name: string, kind: "need" | "want" | "unspecified"): CategoryIconId {
  const n = name.trim().toLowerCase();
  for (const rule of NAME_RULES) {
    if (rule.re.test(n)) return rule.icon;
  }
  if (kind === "need") return "home";
  if (kind === "want") return "sparkle";
  return DEFAULT_CATEGORY_ICON;
}
