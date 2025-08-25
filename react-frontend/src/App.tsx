import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Heart, Bell, Settings, Menu, X, Home, Palette, DollarSign, Search, MessageCircle } from 'lucide-react';

// Import page components
import Index from './pages/Index';
import WeddingPreferences from './pages/WeddingPreferences';
import BudgetManagement from './pages/BudgetManagement';
import VendorDiscovery from './pages/VendorDiscovery';
import VendorCommunication from './pages/VendorCommunication';
import AIChat from './pages/AIChat';

// Simple AI Chat Widget Component
const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-4 w-96 h-[28rem] bg-white rounded-2xl shadow-2xl border-2 border-orange-200">
          <div className="p-6 bg-gradient-to-r from-orange-200 to-pink-200 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-xl">AI Assistant</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-700 hover:text-red-500 text-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="p-6 h-80 overflow-y-auto">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-100 to-pink-100 p-4 rounded-xl border border-orange-200">
                <p className="text-gray-800 text-lg">Hi! I'm your wedding planning assistant. How can I help you today?</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white p-5 rounded-full shadow-xl transition-all duration-300 hover:scale-110 transform"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
};

// Logo component with fallback
const LogoWithFallback: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-400 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
        <Heart className="w-8 h-8 text-white" />
      </div>
      <span className="text-3xl font-bold text-gray-800 tracking-wide">Shehnai.AI</span>
    </div>
  );
};

const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, path: '/', highlight: 'bg-pastel-peach' },
    { id: 'preferences', name: 'Wedding Preferences', icon: Palette, path: '/wedding-preferences', highlight: 'bg-pastel-coral' },
    { id: 'budget', name: 'Budget Management', icon: DollarSign, path: '/budget-management', highlight: 'bg-pastel-sage' },
    { id: 'discovery', name: 'Vendor Discovery', icon: Search, path: '/vendor-discovery', highlight: 'bg-pastel-sky' },
    { id: 'communication', name: 'Vendor Communication', icon: MessageCircle, path: '/vendor-communication', highlight: 'bg-pastel-mint' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: MessageCircle, path: '/ai-assistant', highlight: 'bg-pastel-lilac' }
  ];

  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentItem = menuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActiveSection(currentItem.id);
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-pastel-lavender-light">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:transform-none`}>

          {/* Logo Section */}
          <div className="p-8 border-b-2 border-orange-200 bg-gradient-to-r from-orange-50 to-pink-50">
            <LogoWithFallback />
          </div>

          {/* Navigation Menu */}
          <nav className="p-6">
            <ul className="space-y-4">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.path}
                    className={`flex items-center p-5 rounded-2xl transition-all duration-300 text-xl font-semibold group hover:scale-105 transform ${
                      activeSection === item.id 
                        ? 'bg-gradient-to-r from-orange-200 to-pink-200 text-gray-800 shadow-lg border-2 border-orange-300' 
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-orange-100 hover:to-pink-100 hover:text-gray-800 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="w-7 h-7 mr-5" />
                    <span className="tracking-wide">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Close button for mobile */}
          <button
            className="absolute top-4 right-4 lg:hidden text-deep-navy"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:ml-80">
          {/* Header */}
          <header className="bg-white shadow-md border-b-2 border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="lg:hidden mr-6 text-gray-700 hover:text-orange-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={28} />
                </button>
                <LogoWithFallback className="lg:hidden" />
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-4 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-orange-400 hover:to-pink-400 rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                  <Bell size={24} />
                </button>
                <button className="p-4 text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-orange-400 hover:to-pink-400 rounded-full transition-all duration-300 shadow-md hover:shadow-lg">
                  <Settings size={24} />
                </button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/wedding-preferences" element={<WeddingPreferences />} />
              <Route path="/budget-management" element={<BudgetManagement />} />
              <Route path="/vendor-discovery" element={<VendorDiscovery />} />
              <Route path="/vendor-communication" element={<VendorCommunication />} />
              <Route path="/ai-assistant" element={<AIChat />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* AI Chat Widget */}
        <AIChatWidget />
      </div>
    </BrowserRouter>
  );
};

export default App;