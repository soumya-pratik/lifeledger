import { NavLink, useLocation } from "react-router-dom";
import { isNavActive, navFeatures } from "@/shared/config/features";
import { FeatureIcon } from "@/shared/ui/FeatureIcon";
import { useEntitlements } from "@/shared/entitlements/EntitlementsProvider";

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { features, entitlements } = useEntitlements();
  const items = navFeatures(features).filter((f) => f.id !== "home" || f.showInNav);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ll-border bg-ll-header/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
        {items.map((item) => {
          const active = isNavActive(item.path, pathname);
          return (
            <li key={item.id} className="flex-1">
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium ${
                  active ? "text-ll-accent" : "text-ll-muted"
                }`}
              >
                <FeatureIcon id={item.icon} className="h-5 w-5" />
                <span className="truncate">
                  {item.title === "Expense tracker" ? "Expenses" : item.title}
                </span>
              </NavLink>
            </li>
          );
        })}
        {entitlements.role === "admin" ? (
          <li className="flex-1">
            <NavLink
              to="/admin"
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium ${
                pathname.startsWith("/admin") ? "text-ll-accent" : "text-ll-muted"
              }`}
            >
              <span className="text-sm font-bold">A</span>
              <span>Admin</span>
            </NavLink>
          </li>
        ) : null}
        <li className="flex-1">
          <NavLink
            to="/settings"
            className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium ${
              pathname.startsWith("/settings") ? "text-ll-accent" : "text-ll-muted"
            }`}
          >
            <SettingsIcon />
            <span>Settings</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 4h-6l-.3 2.5a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1L9 20h6l.3-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
