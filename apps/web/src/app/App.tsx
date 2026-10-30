import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { RequireAuth } from "../auth/RequireAuth";
import { AppShell } from "./AppShell";
import { AdminShell } from "./AdminShell";
import { HomePage } from "../pages/HomePage";
import { EntriesPage } from "../pages/EntriesPage";
import { LoginPage } from "../pages/LoginPage";
import { AuthCallbackPage } from "../pages/AuthCallbackPage";
import { SummaryPage } from "../pages/SummaryPage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { AdminPage } from "../pages/AdminPage";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { BudgetPage } from "../pages/BudgetPage";
import "./../admin.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

function RoleHome() {
  const { profile } = useAuth();
  return <Navigate to={profile?.role === "admin" ? "/admin" : "/app"} replace />;
}

export function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/auth/callback" element={<AuthCallbackPage/>}/>
      <Route element={<RequireAuth/>}>
        <Route path="/" element={<RoleHome/>}/>
        <Route path="/admin" element={<AdminShell/>}>
          <Route index element={<AdminPage/>}/>
          <Route path="settings" element={<AdminSettingsPage/>}/>
          <Route path="*" element={<Navigate to="/admin" replace/>}/>
        </Route>
        <Route element={<AppShell/>}>
          <Route path="/app" element={<HomePage/>}/>
          <Route path="/app/entries" element={<EntriesPage/>}/>
          <Route path="/app/summary" element={<SummaryPage/>}/>
          <Route path="/app/budget" element={<BudgetPage/>}/>
          <Route path="/app/categories" element={<CategoriesPage/>}/>
          <Route path="/app/settings" element={<SettingsPage/>}/>
          <Route path="/app/*" element={<Navigate to="/app" replace/>}/>
          <Route path="/entries" element={<Navigate to="/app/entries" replace/>}/>
          <Route path="/summary" element={<Navigate to="/app/summary" replace/>}/>
          <Route path="/budget" element={<Navigate to="/app/budget" replace/>}/>
          <Route path="/categories" element={<Navigate to="/app/categories" replace/>}/>
          <Route path="/settings" element={<Navigate to="/app/settings" replace/>}/>
          <Route path="*" element={<RoleHome/>}/>
        </Route>
      </Route>
    </Routes>
  </BrowserRouter></AuthProvider></QueryClientProvider>;
}
