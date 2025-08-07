import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu } from "lucide-react";
import { AnimatedSidebar } from './components/AnimatedSidebar';
import { NotificationProvider } from './components/NotificationProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAppStore } from './store/useAppStore';
import './App.css';

// Lazy load pages for better performance
const Index = React.lazy(() => import('./pages/Index'));
const VendorDiscovery = React.lazy(() => import('./pages/VendorDiscovery'));
const BudgetManagement = React.lazy(() => import('./pages/BudgetManagement'));
const WeddingPreferences = React.lazy(() => import('./pages/WeddingPreferences'));
const AIChat = React.lazy(() => import('./pages/AIChat'));
const GoogleIntegration = React.lazy(() => import('./components/GoogleIntegration'));

const App: React.FC = () => {
  const { setSidebarOpen, theme } = useAppStore();

  // Add error handling for any uncaught errors
  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <NotificationProvider>
      <BrowserRouter>
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-soft-beige'}`}>
          {/* Animated Sidebar */}
          <AnimatedSidebar />

          {/* Main content */}
          <div className="lg:pl-64">
            {/* Mobile header */}
            <div className={`lg:hidden sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 shadow-sm border-b border-gray-700' : 'bg-white shadow-sm border-b border-gray-200'}`}>
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-pastel-rose/20 text-deep-navy'}`}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-deep-navy'}`}>BID AI Wedding</h1>
                <div className="w-10"></div>
              </div>
            </div>

            {/* Page content with Suspense */}
            <main>
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${theme === 'dark' ? 'border-green-500' : 'border-salmon-pink'}`}></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/vendors" element={<VendorDiscovery />} />
                    <Route path="/budget" element={<BudgetManagement />} />
                    <Route path="/preferences" element={<WeddingPreferences />} />
                    <Route path="/chat" element={<AIChat />} />
                    <Route path="/google-integration" element={<GoogleIntegration />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </NotificationProvider>
  );
};

export default App; 