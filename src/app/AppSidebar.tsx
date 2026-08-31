import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { isNavActive, listFeatures, navFeatures, type AppFeature } from "@/shared/config/features";
import { FeatureIcon } from "@/shared/ui/FeatureIcon";

const COLLAPSE_KEY = "lifeledger.navCollapsed";

export function AppSidebar({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [features, setFeatures] = useState<AppFeature[]>([]);
  const { pathname } = useLocation();

  useEffect(() => {
    void listFeatures().then(setFeatures);
  }, []);

  function toggleCollapse() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const compact = variant === "desktop" && collapsed;
  const items = navFeatures(features);

  return (
    <aside
      className={`flex h-full flex-col border-r border-ll-border bg-ll-nav ${compact ? "w-[4.25rem]" : "w-56"}`}
    >
      <div className={`flex h-14 items-center border-b border-ll-border ${compact ? "justify-center px-2" : "px-3"}`}>
        <span className={`text-xs font-semibold uppercase tracking-wider text-ll-muted ${compact ? "sr-only" : ""}`}>
          Menu
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {items.map((item) => {
          const active = isNavActive(item.path, pathname);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/"}
              onClick={onNavigate}
              title={item.title}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                active ? "bg-ll-bg text-ll-accent" : "text-ll-muted hover:bg-ll-bg hover:text-ll-text"
              } ${compact ? "justify-center px-2" : ""}`}
            >
              <FeatureIcon id={item.icon} />
              {compact ? <span className="sr-only">{item.title}</span> : item.title}
            </NavLink>
          );
        })}
      </nav>
      {variant === "desktop" ? (
        <button
          type="button"
          className="border-t border-ll-border px-3 py-3 text-left text-xs text-ll-muted hover:text-ll-text"
          onClick={toggleCollapse}
        >
          {compact ? "»" : "« Collapse"}
        </button>
      ) : null}
    </aside>
  );
}
