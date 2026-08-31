import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { homeFeatures, listFeatures, type AppFeature } from "@/shared/config/features";
import { FeatureIcon } from "@/shared/ui/FeatureIcon";

export function HomePage() {
  const { displayName } = useSession();
  const [features, setFeatures] = useState<AppFeature[]>([]);

  useEffect(() => {
    void listFeatures().then(setFeatures);
  }, []);

  const cards = homeFeatures(features);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {displayName}</h1>
        <p className="mt-1 text-sm text-ll-muted">Choose a feature to get started.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map((feature) => (
          <li key={feature.id}>
            <Link
              to={feature.path}
              className="flex h-full flex-col rounded-2xl border border-ll-border bg-ll-surface p-5 hover:border-ll-accent"
            >
              <FeatureIcon id={feature.icon} className="h-6 w-6 text-ll-accent" />
              <h2 className="mt-3 text-base font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm text-ll-muted">{feature.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      {cards.length === 0 ? <p className="text-sm text-ll-muted">No features enabled.</p> : null}
    </div>
  );
}
