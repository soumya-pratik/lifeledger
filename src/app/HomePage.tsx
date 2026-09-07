import { Link, useLocation } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { homeFeatures } from "@/shared/config/features";
import { useEntitlements } from "@/shared/entitlements/EntitlementsProvider";
import { FeatureIcon } from "@/shared/ui/FeatureIcon";
import { PageHeader } from "@/shared/ui/chrome";

export function HomePage() {
  const { displayName, ledger } = useSession();
  const { features } = useEntitlements();
  const location = useLocation();
  const locked = (location.state as { planLocked?: string } | null)?.planLocked;
  const cards = homeFeatures(features);

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Home"
        title={`Hi, ${displayName}`}
        description={`Active ledger: ${ledger.name}. Open a module to continue.`}
      />
      {locked === "splits" ? (
        <p className="rounded-xl border border-ll-warn/40 bg-ll-surface px-4 py-3 text-sm text-ll-warn">
          Splits is not enabled for your account. An admin can turn it on from Admin.
        </p>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((feature) => (
          <li key={feature.id}>
            <Link
              to={feature.path}
              className="group flex h-full flex-col rounded-2xl border border-ll-border bg-ll-surface p-6 shadow-[var(--ll-shadow)] transition hover:border-ll-accent"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ll-bg text-ll-accent">
                <FeatureIcon id={feature.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{feature.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-ll-muted">{feature.description}</p>
              <span className="mt-4 text-sm font-medium text-ll-accent group-hover:underline">Open</span>
            </Link>
          </li>
        ))}
      </ul>
      {cards.length === 0 ? <p className="text-sm text-ll-muted">No modules enabled.</p> : null}
    </div>
  );
}
