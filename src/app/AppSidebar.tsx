import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { isNavActive, navFeatures } from "@/shared/config/features";
import { FeatureIcon } from "@/shared/ui/FeatureIcon";
import { useEntitlements } from "@/shared/entitlements/EntitlementsProvider";

const COLLAPSE_KEY = "lifeledger.navCollapsed";

export function AppSidebar({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const { pathname } = useLocation();
  const { features, entitlements } = useEntitlements();

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
      className={`flex h-full flex-col border-r border-ll-border bg-ll-nav ${compact ? "w-[4.5rem]" : "w-60"}`}
    >
      <div className={`flex h-14 items-center border-b border-ll-border ${compact ? "justify-center px-2" : "px-4"}`}>
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] text-ll-accent ${compact ? "sr-only" : ""}`}
        >
          LifeLedger
        </span>
        {compact ? (
          <span className="text-xs font-bold text-ll-accent" aria-hidden>
            LL
          </span>
        ) : null}
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                active ? "bg-ll-bg text-ll-accent shadow-[var(--ll-shadow)]" : "text-ll-muted hover:bg-ll-bg hover:text-ll-text"
              } ${compact ? "justify-center px-2" : ""}`}
            >
              <FeatureIcon id={item.icon} />
              {compact ? <span className="sr-only">{item.title}</span> : item.title}
            </NavLink>
          );
        })}
        {entitlements.role === "admin" ? (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            title="Admin"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              pathname.startsWith("/admin")
                ? "bg-ll-bg text-ll-accent shadow-[var(--ll-shadow)]"
                : "text-ll-muted hover:bg-ll-bg hover:text-ll-text"
            } ${compact ? "justify-center px-2" : ""}`}
          >
            <AdminNavIcon />
            {compact ? <span className="sr-only">Admin</span> : "Admin"}
          </NavLink>
        ) : null}
      </nav>
      {variant === "desktop" ? (
        <button
          type="button"
          className="flex items-center justify-center border-t border-ll-border py-3 text-ll-muted hover:bg-ll-bg hover:text-ll-text"
          onClick={toggleCollapse}
          aria-label={compact ? "Expand menu" : "Collapse menu"}
        >
          <span className="text-sm" aria-hidden>
            {compact ? "›" : "‹"}
          </span>
        </button>
      ) : null}
    </aside>
  );
}

function AdminNavIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4 7v4c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V7l-8-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
