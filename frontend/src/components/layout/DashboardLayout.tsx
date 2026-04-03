import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FloatingAddButton } from "@/components/applications/FloatingAddButton";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { ApplicationDetailModal } from "@/components/applications/ApplicationDetailModal";
import { useApplicationStore } from "@/stores/applicationStore";


export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const selectedApplication = useApplicationStore((s) => s.selectedApplication);
  const setSelectedApplication = useApplicationStore(
    (s) => s.setSelectedApplication,
  );

  return (
    <div className="flex h-screen flex-col">
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>

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

    </div>
  );
}
