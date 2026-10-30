import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { RequireAuth } from "../auth/RequireAuth";
import { AppShell } from "./AppShell";
import { HomePage } from "../pages/HomePage";
import { EntriesPage } from "../pages/EntriesPage";
import { LoginPage } from "../pages/LoginPage";
import { AuthCallbackPage } from "../pages/AuthCallbackPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="entries" element={<EntriesPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}