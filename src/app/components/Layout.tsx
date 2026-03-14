import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TourOverlay } from './TourOverlay';
import { HospitalProvider } from '../../contexts/HospitalContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTour } from '../../hooks/useTour';

// Re-exported so existing pages (e.g. Dashboard.tsx) keep working without changes
export { useHospitalContext } from '../../contexts/HospitalContext';

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const tour = useTour();

  // Auto-start tour for first-time users after a short delay
  useEffect(() => {
    if (loading || tour.hasCompleted || !user) return;
    const timer = setTimeout(() => {
      tour.startTour();
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, loading, tour.hasCompleted, tour.startTour]);

  return (
    <HospitalProvider>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        {/* Dark backdrop — mobile sidebar overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <Header
          onMenuOpen={() => setIsMobileMenuOpen(true)}
          onStartTour={tour.resetTour}
        />

        {/* Main content: full-width on mobile, offset by sidebar on desktop */}
        <main className="pt-16 lg:ml-64">
          <Outlet />
        </main>

        <TourOverlay tour={tour} />
      </div>
    </HospitalProvider>
  );
}
