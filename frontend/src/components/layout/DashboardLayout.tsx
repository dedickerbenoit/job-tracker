import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { FloatingAddButton } from "@/components/applications/FloatingAddButton";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { ApplicationDetailModal } from "@/components/applications/ApplicationDetailModal";
import { useApplicationStore } from "@/stores/applicationStore";
import { useAuthStore } from "@/stores/authStore";
import { t } from "@/lib/i18n";

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const selectedApplication = useApplicationStore((s) => s.selectedApplication);
  const setSelectedApplication = useApplicationStore(
    (s) => s.setSelectedApplication,
  );
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const isSuspended = !!user?.suspended_at;
  const isAccountPage = location.pathname === "/dashboard/account";
  const showOverlay = isSuspended && !isAccountPage;

  return (
    <div className="flex h-screen flex-col">
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />

        <main className="relative flex-1 overflow-y-auto bg-muted/30 p-6">
          <div
            className={
              showOverlay ? "pointer-events-none select-none blur-sm" : ""
            }
          >
            <Outlet />
          </div>

          {showOverlay && (
            <div className="absolute inset-0 flex items-start justify-center bg-background/60 pt-24">
              <div className="mx-4 max-w-md rounded-lg border border-orange-500/30 bg-card p-6 shadow-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {t.rgpd.accountSuspendedBanner}
                    </p>
                    <Link
                      to="/dashboard/account"
                      className="inline-block text-sm font-medium text-orange-600 underline underline-offset-4 hover:text-orange-700"
                    >
                      {t.rgpd.reactivateAccount}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {!isSuspended && (
        <>
          <FloatingAddButton onClick={() => setAddModalOpen(true)} />

          <ApplicationModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
          />

          {selectedApplication && (
            <ApplicationDetailModal
              application={selectedApplication}
              open={!!selectedApplication}
              onClose={() => setSelectedApplication(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
