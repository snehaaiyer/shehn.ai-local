import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

// Couple page imports
import Index from './pages/Index';
import WeddingPreferences from './pages/WeddingPreferences';
import BudgetManagement from './pages/BudgetManagement';
import VendorDiscovery from './pages/VendorDiscovery';
import AIChat from './pages/AIChat';
import SmartPlanner from './pages/SmartPlanner';
import WeddingInvites from './pages/WeddingInvites';
import BlueprintReview from './pages/BlueprintReview';
import Timeline from './pages/Timeline';
import Quotes from './pages/Quotes';
import Messages from './pages/Messages';
import PublicRSVP from './pages/PublicRSVP';

// Vendor page imports
import VendorRegister from './pages/vendor/VendorRegister';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorMarketplace from './pages/vendor/VendorMarketplace';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorInbox from './pages/vendor/VendorInbox';
import VendorCalendarPage from './pages/vendor/VendorCalendarPage';

// Admin page imports
import VendorApprovals from './pages/admin/VendorApprovals';
import UserList from './pages/admin/UserList';

// Component imports
import { AnimatedSidebar } from './components/AnimatedSidebar';
import AIChatWidget from './components/AIChatWidget';
import { useAppStore } from './store/useAppStore';

// CSS
import './App.css';

function App() {
  const { sidebarOpen, setSidebarOpen, currentRole, theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public routes — no sidebar */}
        <Route path="/rsvp/:inviteCode" element={<PublicRSVP />} />
        <Route path="/vendor/register" element={<VendorRegister />} />

        {/* App shell with sidebar */}
        <Route path="*" element={
          <div className={`min-h-screen transition-colors duration-300 ${
            isDark ? 'bg-gray-900' : 'bg-[#FAFAF8]'
          }`}>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden fixed top-2 sm:top-4 left-2 sm:left-4 z-50 p-2 sm:p-2.5 rounded-xl shadow-card border transition-all hover:shadow-elevated active:scale-95 ${
                isDark
                  ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700 text-gray-300'
                  : 'bg-white/90 backdrop-blur-sm border-gray-100 text-gray-700'
              }`}
            >
              <Menu size={18} className="sm:w-5 sm:h-5" />
            </button>

            <AnimatedSidebar />

            <div className="lg:pl-[260px]">
              <main className="min-h-screen">
                <Routes>
                  {/* Couple routes */}
                  {currentRole === 'couple' && <>
                    <Route path="/" element={<Index />} />
                    <Route path="/preferences" element={<WeddingPreferences />} />
                    <Route path="/budget" element={<BudgetManagement />} />
                    <Route path="/vendors" element={<VendorDiscovery />} />
                    <Route path="/vendor-discovery" element={<VendorDiscovery />} />
                    <Route path="/wedding-invites" element={<WeddingInvites />} />
                    <Route path="/ai-chat" element={<Navigate to="/plan" replace />} />
                    <Route path="/blueprint" element={<BlueprintReview />} />
                    <Route path="/quotes" element={<Quotes />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/plan" element={<SmartPlanner />} />
                    <Route path="/timeline" element={<Timeline />} />
                  </>}

                  {/* Vendor routes */}
                  {currentRole === 'vendor' && <>
                    <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor/marketplace" element={<VendorMarketplace />} />
                    <Route path="/vendor/profile" element={<VendorProfile />} />
                    <Route path="/vendor/inbox" element={<VendorInbox />} />
                    <Route path="/vendor/calendar" element={<VendorCalendarPage />} />
                  </>}

                  {/* Admin routes */}
                  {currentRole === 'superadmin' && <>
                    <Route path="/admin/vendors" element={<VendorApprovals />} />
                    <Route path="/admin/users" element={<UserList />} />
                  </>}

                  {/* Redirect old routes */}
                  <Route path="/vendor-communication" element={<Navigate to="/messages" replace />} />

                  <Route path="*" element={<Navigate to={
                    currentRole === 'vendor' ? '/vendor/dashboard' :
                    currentRole === 'superadmin' ? '/admin/vendors' : '/'
                  } replace />} />
                </Routes>
              </main>
            </div>

            <AIChatWidget />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
