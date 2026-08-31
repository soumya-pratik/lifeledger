import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/shared/auth/SessionProvider";
import { useTheme } from "@/shared/theme/ThemeProvider";

export function AppHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const { displayName, email, avatarUrl, signOut } = useSession();
  const { theme, toggleBuiltin } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initial = (displayName || email || "U").slice(0, 1).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ll-border bg-ll-header px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-ll-text md:hidden"
          aria-label="Open menu"
          onClick={onOpenNav}
        >
          <MenuIcon />
        </button>
        <Link to="/" className="truncate text-sm font-semibold tracking-tight text-ll-text">
          LifeLedger
        </Link>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => void toggleBuiltin()}
          className="rounded-lg px-2 py-1.5 text-xs text-ll-muted hover:bg-ll-bg hover:text-ll-text"
          aria-label="Toggle theme"
          title={`Theme: ${theme.name}`}
        >
          {theme.id === "dark" ? "Light" : "Dark"}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-ll-border bg-ll-bg text-sm font-medium"
            onClick={() => setOpen((v) => !v)}
            aria-label="Profile menu"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
          {open ? (
            <div className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-ll-border bg-ll-surface py-1 shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-ll-muted">{email}</p>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-ll-bg"
                onClick={() => {
                  setOpen(false);
                  void navigate("/settings");
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-ll-danger hover:bg-ll-bg"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
