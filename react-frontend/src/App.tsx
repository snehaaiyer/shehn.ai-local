
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
        <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-xl border">
          <div className="p-4 bg-pastel-peach rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-deep-navy text-lg">AI Assistant</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-deep-navy hover:text-salmon-pink text-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="p-4 h-72 overflow-y-auto">
            <div className="space-y-3">
              <div className="bg-pastel-lavender p-3 rounded-lg">
                <p className="text-deep-navy text-base">Hi! I'm your wedding planning assistant. How can I help you today?</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-soft-peach hover:bg-salmon-pink text-white p-4 rounded-full shadow-lg transition-all duration-300 hover-lift"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

// Logo component with fallback
const LogoWithFallback: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-salmon-pink to-soft-peach rounded-xl flex items-center justify-center mr-3">
        <Heart className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-bold text-deep-navy">Shehnai.AI</span>
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
        <div className={`fixed left-0 top-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:transform-none`}>
          
          {/* Logo Section */}
          <div className="p-6 border-b border-pastel-lavender">
            <LogoWithFallback />
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            <ul className="space-y-3">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.path}
                    className={`flex items-center p-4 rounded-xl transition-all duration-200 text-lg font-medium hover-lift ${
                      activeSection === item.id 
                        ? `${item.highlight} text-deep-navy shadow-md` 
                        : 'text-muted-green hover:bg-pastel-lavender hover:text-deep-navy'
                    }`}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <item.icon className="w-6 h-6 mr-4" />
                    <span>{item.name}</span>
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
        <div className="lg:ml-72">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-pastel-lavender p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="lg:hidden mr-4 text-deep-navy"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={24} />
                </button>
                <LogoWithFallback className="lg:hidden" />
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-3 text-muted-green hover:text-salmon-pink hover:bg-pastel-peach rounded-full transition-all duration-200">
                  <Bell size={20} />
                </button>
                <button className="p-3 text-muted-green hover:text-salmon-pink hover:bg-pastel-peach rounded-full transition-all duration-200">
                  <Settings size={20} />
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
