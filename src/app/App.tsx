import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "@/app/Shell";
import { HomePage } from "@/app/HomePage";
import { LoginPage } from "@/app/LoginPage";
import { RequireAuth } from "@/app/RequireAuth";
import { SettingsPage } from "@/app/SettingsPage";
import { ExpensesPage } from "@/features/expenses/screens/ExpensesPage";
import { ImportPage } from "@/features/imports/screens/ImportPage";
import { ExpensesLayout } from "@/features/expenses/screens/ExpensesLayout";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="expenses" element={<ExpensesLayout />}>
          <Route index element={<ExpensesPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
