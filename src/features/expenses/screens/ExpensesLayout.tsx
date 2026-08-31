import { NavLink, Outlet } from "react-router-dom";

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm ${isActive ? "bg-ll-bg text-ll-accent" : "text-ll-muted hover:text-ll-text"}`;

export function ExpensesLayout() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Expense tracker</h1>
        <nav className="flex gap-1 rounded-full border border-ll-border bg-ll-surface p-1">
          <NavLink to="/expenses" className={tab} end>
            Ledger
          </NavLink>
          <NavLink to="/expenses/import" className={tab}>
            Statements
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
