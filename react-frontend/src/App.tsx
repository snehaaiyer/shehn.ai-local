
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Heart, Bell, Settings, Menu, X, Home, Palette, DollarSign, Search, MessageCircle } from 'lucide-react';
import Index from './pages/Index';
import WeddingPreferences from './pages/WeddingPreferences';
import BudgetManagement from './pages/BudgetManagement';
import VendorDiscovery from './pages/VendorDiscovery';
import VendorCommunication from './pages/VendorCommunication';
import AIChat from './pages/AIChat';
import { AIChatWidget } from './components/AIChatWidget';
import { useAppStore } from './store/useAppStore';
import './App.css';

const LogoWithFallback: React.FC = () => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
        <Heart className="w-5 h-5 text-white" />
      </div>
    );
  }

  return (
    <img
      src="/shehnai-logo.png"
      alt="Shehnai.AI Logo"
      className="w-8 h-8 rounded-lg"
      onError={handleImageError}
    />
  );
};

const App: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: true },
    { name: 'Wedding Preferences', href: '/wedding-preferences', icon: Palette, current: false },
    { name: 'Budget Management', href: '/budget-management', icon: DollarSign, current: false },
    { name: 'Vendor Discovery', href: '/vendor-discovery', icon: Search, current: false },
    { name: 'Vendor Communication', href: '/vendor-communication', icon: MessageCircle, current: false },
    { name: 'AI Assistant', href: '/ai-chat', icon: MessageCircle, current: false },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex flex-shrink-0 items-center px-4 py-4">
                <LogoWithFallback />
                <span className="ml-2 text-xl font-semibold text-gray-900">Shehnai.AI</span>
              </div>
              <nav className="mt-5 flex-1 space-y-1 px-2">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <item.icon className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <LogoWithFallback />
              <span className="ml-2 text-xl font-semibold text-gray-900">Shehnai.AI</span>
            </div>
            <nav className="mt-6 flex-1 space-y-1 px-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          {/* Top navigation */}
          <div className="sticky top-0 z-40 lg:mx-auto lg:max-w-7xl lg:px-8">
            <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="relative flex flex-1"></div>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                  >
                    <Bell className="h-6 w-6" />
                  </button>

                  <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                  <button
                    type="button"
                    className="-m-1.5 p-1.5 text-gray-400 hover:text-gray-500"
                  >
                    <Settings className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/wedding-preferences" element={<WeddingPreferences />} />
              <Route path="/budget-management" element={<BudgetManagement />} />
              <Route path="/vendor-discovery" element={<VendorDiscovery />} />
              <Route path="/vendor-communication" element={<VendorCommunication />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <AIChatWidget />
      </div>
    </BrowserRouter>
  );
};

export default App;
