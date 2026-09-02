import type { CategoryIconId } from "@/shared/domain/categoryIcon";
import { DEFAULT_CATEGORY_ICON } from "@/shared/domain/categoryIcon";

const paths: Record<CategoryIconId, string> = {
  utensils: "M7 4v16M11 4v7a2 2 0 0 1-2 2H7M17 4c0 4-2 6-2 10v6M17 4h2",
  cart: "M4 5h2l2 12h10l2-8H7M9 20.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  bus: "M5 6h14v10H5V6Zm0 10 1.5 3h2L7 16m10 0 1.5 3h2L17 16M8 9h.01M16 9h.01",
  car: "M5 13h14l-1.5-5H6.5L5 13Zm0 0v4h2v-1h10v1h2v-4M8 16.5h.01M16 16.5h.01",
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z",
  bolt: "M13 3 6 14h6l-1 7 7-11h-6l1-7Z",
  droplet: "M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11Z",
  heart: "M12 20s-7-4.3-7-9.2C5 8 7 6.2 9.2 6.2c1.3 0 2.4.6 2.8 1.6.4-1 1.5-1.6 2.8-1.6C17 6.2 19 8 19 10.8 19 15.7 12 20 12 20Z",
  pill: "M8.5 8.5 15.5 15.5M9 4.5a4.5 4.5 0 0 1 6.4 6.4L9 17.2A4.5 4.5 0 1 1 9 4.5Z",
  arrows: "M7 8h11M15 5l3 3-3 3M17 16H6m3 3-3-3 3-3",
  tag: "M4 12.5 12.5 4H19v6.5L10.5 20 4 13.5v-1ZM16 8h.01",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0V7a3 3 0 0 1 6 0v1",
  film: "M5 6h14v12H5V6Zm4 0v12M15 6v12M5 10h14M5 14h14",
  dumbbell: "M6 9v6M8 8v8M16 8v8M18 9v6M8 12h8",
  gift: "M4 10h16v10H4V10Zm0 0V8h16v2M12 8v12M12 8c0-2-1.5-3.5-3.5-3.5S5 6 5 8m7 0c0-2 1.5-3.5 3.5-3.5S19 6 19 8",
  plane: "M3 12l18-8-6 18-3-7-9-3Z",
  coffee: "M6 9h10v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V9Zm10 1h1.5A2.5 2.5 0 0 1 20 12.5 2.5 2.5 0 0 1 17.5 15H16M8 21h8",
  paw: "M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-9 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 19c2.5 0 4-1.8 4-3.5S13.5 13 12 13s-4 1.8-4 3.5S9.5 19 12 19Z",
  book: "M5 5h11a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5Zm0 0v14",
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm4 16h.01",
  baby: "M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 9c.5-3 2.5-5 5-5s4.5 2 5 5",
  sparkle: "M12 3v4M12 17v4M4.2 7.2l2.8 2.8M17 14l2.8 2.8M4.2 16.8 7 14M17 10l2.8-2.8M8 12h8",
  shirt: "M8 6 12 8l4-2 3 3-2 2v9H7V9L5 7l3-3Z",
  wrench: "M14 7a4 4 0 0 0-5.7 5.2L4 16.5 7.5 20l4.3-4.3A4 4 0 0 0 17 11l-3 3",
  music: "M9 18V6l10-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Zm10-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z",
  game: "M6 10h12v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-6Zm3 3h.01M15 12h2m-1-1v2",
  leaf: "M5 19c8-1 14-8 14-15-7 0-14 6-14 14Zm0 0 5-5",
  bank: "M4 10h16M6 10v8m12-8v8M4 18h16M12 4 4 10h16L12 4Z",
  shield: "M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z",
  wine: "M8 4h8l-1 7a3 3 0 1 1-6 0L8 4Zm4 10v6m-3 0h6",
};

export function CategoryIcon({
  id,
  className,
}: {
  id: CategoryIconId | string | null | undefined;
  className?: string;
}) {
  const icon = (id && id in paths ? id : DEFAULT_CATEGORY_ICON) as CategoryIconId;
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={paths[icon]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
