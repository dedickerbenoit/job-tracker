import { Link, Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b bg-background px-4">
        <Link to="/" className="text-lg font-bold tracking-tight">
          JobTracker
        </Link>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
