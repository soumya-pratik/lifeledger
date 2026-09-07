import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "@/app/Shell";
import { HomePage } from "@/app/HomePage";
import { LoginPage } from "@/app/LoginPage";
import { EntitlementsProvider } from "@/shared/entitlements/EntitlementsProvider";
import { RequireAuth } from "@/app/RequireAuth";
import { RequireModule } from "@/app/RequireModule";
import { RequireRole } from "@/app/RequireRole";
import { AdminPage } from "@/app/AdminPage";
import { SettingsPage } from "@/app/SettingsPage";
import { ExpensesPage } from "@/features/expenses/screens/ExpensesPage";
import { ImportPage } from "@/features/imports/screens/ImportPage";
import { ExpensesLayout } from "@/features/expenses/screens/ExpensesLayout";
import { InsightsPage } from "@/features/expenses/screens/InsightsPage";
import { SplitsHomePage } from "@/features/splits/screens/SplitsHomePage";
import { NewGroupPage } from "@/features/splits/screens/NewGroupPage";
import { GroupDetailPage } from "@/features/splits/screens/GroupDetailPage";
import { NewSplitExpensePage } from "@/features/splits/screens/NewSplitExpensePage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <EntitlementsProvider>
              <Shell />
            </EntitlementsProvider>
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="expenses" element={<ExpensesLayout />}>
          <Route index element={<ExpensesPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="insights" element={<InsightsPage />} />
        </Route>
        <Route path="insights" element={<Navigate to="/expenses/insights" replace />} />
        <Route
          path="splits"
          element={
            <RequireModule moduleId="splits">
              <SplitsHomePage />
            </RequireModule>
          }
        />
        <Route
          path="splits/groups/new"
          element={
            <RequireModule moduleId="splits">
              <NewGroupPage />
            </RequireModule>
          }
        />
        <Route
          path="splits/groups/:id"
          element={
            <RequireModule moduleId="splits">
              <GroupDetailPage />
            </RequireModule>
          }
        />
        <Route
          path="splits/groups/:id/expenses/new"
          element={
            <RequireModule moduleId="splits">
              <NewSplitExpensePage />
            </RequireModule>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="admin"
          element={
            <RequireRole role="admin">
              <AdminPage />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
