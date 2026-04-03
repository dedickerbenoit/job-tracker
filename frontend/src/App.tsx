import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const KanbanView = lazy(() => import('@/pages/KanbanView'));
const ListView = lazy(() => import('@/pages/ListView'));
const TimelineView = lazy(() => import('@/pages/TimelineView'));
const StatsView = lazy(() => import('@/pages/StatsView'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/kanban" replace />} />
            <Route path="kanban" element={<Suspense fallback={<PageLoader />}><KanbanView /></Suspense>} />
            <Route path="list" element={<Suspense fallback={<PageLoader />}><ListView /></Suspense>} />
            <Route path="timeline" element={<Suspense fallback={<PageLoader />}><TimelineView /></Suspense>} />
            <Route path="stats" element={<Suspense fallback={<PageLoader />}><StatsView /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  );
}

export default App;
