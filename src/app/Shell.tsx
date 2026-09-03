import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppHeader } from "@/app/AppHeader";
import { AppSidebar } from "@/app/AppSidebar";
import { MobileBottomNav } from "@/app/MobileBottomNav";
import { InstallBanner } from "@/shared/pwa/InstallBanner";

export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-ll-bg text-ll-text">
      <div className="sticky top-0 hidden h-dvh md:block">
        <AppSidebar variant="desktop" />
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--ll-overlay)]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-56">
            <AppSidebar variant="mobile" onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenNav={() => setMobileOpen(true)} />
        <main className="shell-main flex-1 overflow-auto p-4 sm:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
        <div className="md:hidden">
          <InstallBanner />
        </div>
        <MobileBottomNav />
      </div>
    </div>
  );
}
