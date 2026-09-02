import { NavLink, Outlet } from "react-router-dom";

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-1.5 text-sm font-medium ${isActive ? "bg-ll-accent text-ll-accent-fg" : "text-ll-muted hover:text-ll-text"}`;

export function ExpensesLayout() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ll-accent">Module</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Expense tracker</h1>
        </div>
        <nav className="flex gap-1 rounded-full border border-ll-border bg-ll-surface p-1 shadow-[var(--ll-shadow)]">
          <NavLink to="/expenses" className={tab} end>
            Ledger
          </NavLink>
          <NavLink to="/expenses/import" className={tab}>
            Statements
          </NavLink>
          <NavLink to="/expenses/insights" className={tab}>
            Patterns
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
