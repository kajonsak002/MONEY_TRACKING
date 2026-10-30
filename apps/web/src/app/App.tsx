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
import { BudgetPage } from "../pages/BudgetPage";
import "./../admin.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

function RoleHome() {
  const { profile } = useAuth();
  return <Navigate to={profile?.role === "admin" ? "/admin" : "/"} replace />;
}

export function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/auth/callback" element={<AuthCallbackPage/>}/>
      <Route element={<RequireAuth/>}>
        <Route path="/admin" element={<AdminShell/>}>
          <Route index element={<AdminPage/>}/>
          <Route path="*" element={<Navigate to="/admin" replace/>}/>
        </Route>
        <Route element={<AppShell/>}>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/entries" element={<EntriesPage/>}/>
          <Route path="/summary" element={<SummaryPage/>}/>
          <Route path="/budget" element={<BudgetPage/>}/>
          <Route path="/categories" element={<CategoriesPage/>}/>
          <Route path="/settings" element={<SettingsPage/>}/>
          <Route path="/app/*" element={<RoleHome/>}/>
          <Route path="*" element={<RoleHome/>}/>
        </Route>
      </Route>
    </Routes>
  </BrowserRouter></AuthProvider></QueryClientProvider>;
}
