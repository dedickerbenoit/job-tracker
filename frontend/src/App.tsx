import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuthStore } from '@/stores/authStore';

const KanbanView = lazy(() => import('@/pages/KanbanView'));
const ListView = lazy(() => import('@/pages/ListView'));
const TimelineView = lazy(() => import('@/pages/TimelineView'));
const StatsView = lazy(() => import('@/pages/StatsView'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const LegalMentionsPage = lazy(() => import('@/pages/LegalMentionsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          {/* Public pages (RGPD) */}
          <Route element={<PublicLayout />}>
            <Route path="/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense>} />
            <Route path="/legal" element={<Suspense fallback={<PageLoader />}><LegalMentionsPage /></Suspense>} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/kanban" replace />} />
              <Route path="kanban" element={<Suspense fallback={<PageLoader />}><KanbanView /></Suspense>} />
              <Route path="list" element={<Suspense fallback={<PageLoader />}><ListView /></Suspense>} />
              <Route path="timeline" element={<Suspense fallback={<PageLoader />}><TimelineView /></Suspense>} />
              <Route path="stats" element={<Suspense fallback={<PageLoader />}><StatsView /></Suspense>} />
              <Route path="account" element={<Suspense fallback={<PageLoader />}><AccountPage /></Suspense>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <AuthModal />
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
