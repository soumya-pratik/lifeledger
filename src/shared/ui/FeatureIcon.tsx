import type { FeatureIconId } from "@/shared/config/features";

export function FeatureIcon({ id, className }: { id: FeatureIconId; className?: string }) {
  const cls = className ?? "h-5 w-5";
  if (id === "wallet") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v1.5M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-5.5a1 1 0 0 0-1-1h-3.2M4 7.5H19"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="16.5" cy="13.5" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (id === "split") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 9.5 14 14.5M14 8l-4 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
