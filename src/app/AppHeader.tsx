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
    <header
      className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-ll-border bg-ll-header px-4 pt-[env(safe-area-inset-top)]"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="rounded-xl p-2 text-ll-text hover:bg-ll-bg md:hidden"
          aria-label="Open menu"
          onClick={onOpenNav}
        >
          <MenuIcon />
        </button>
        <Link to="/" className="truncate text-sm font-semibold tracking-tight text-ll-text md:hidden">
          LifeLedger
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void toggleBuiltin()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-ll-muted hover:bg-ll-bg hover:text-ll-text"
          aria-label="Toggle theme"
          title={`Theme: ${theme.name}`}
        >
          {theme.id === "dark" ? <SunIcon /> : <MoonIcon />}
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
            <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-ll-border bg-ll-surface py-1 shadow-[var(--ll-shadow)]">
              <div className="border-b border-ll-border px-3 py-2">
                <p className="truncate text-sm font-medium text-ll-text">{displayName}</p>
                <p className="truncate text-xs text-ll-muted">{email}</p>
              </div>
              <button
                type="button"
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-ll-bg"
                onClick={() => {
                  setOpen(false);
                  void navigate("/settings");
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2.5 text-left text-sm text-ll-danger hover:bg-ll-bg"
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

function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 3a8 8 0 1 0 5 13 7 7 0 0 1-5-13Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
