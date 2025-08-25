
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Home, 
  Heart, 
  Palette, 
  DollarSign, 
  Search, 
  MessageCircle,
  Bot,
  Building2,
  Menu,
  X
} from 'lucide-react';

// Page imports
import Index from './pages/Index';
import WeddingPreferences from './pages/WeddingPreferences';
import BudgetManagement from './pages/BudgetManagement';
import VendorDiscovery from './pages/VendorDiscovery';
import VendorCommunication from './pages/VendorCommunication';
import AIChat from './pages/AIChat';

// Component imports
import AIChatWidget from './components/AIChatWidget';

// CSS
import './App.css';

const LogoWithFallback = ({ size = 40 }: { size?: number }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <div 
      className="flex items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: logoError ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'transparent'
      }}
    >
      {logoError ? (
        <Heart className="text-white" size={size * 0.6} />
      ) : (
        <img
          src="/shehnai-logo.png"
          alt="Shehnai.AI"
          width={size}
          height={size}
          onError={() => setLogoError(true)}
          className="rounded-xl"
        />
      )}
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'preferences', label: 'Wedding Preferences', icon: Heart, path: '/preferences' },
    { id: 'budget', label: 'Budget Management', icon: DollarSign, path: '/budget' },
    { id: 'vendor-discovery', label: 'Vendor Discovery', icon: Search, path: '/vendor-discovery' },
    { id: 'vendor-communication', label: 'Vendor Communication', icon: MessageCircle, path: '/vendor-communication' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, path: '/ai-assistant' }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LogoWithFallback size={32} />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              Shehnai.AI
            </span>
          </div>
          <button 
            onClick={toggleMobileMenu}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-white w-80 h-full shadow-lg p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3 mb-8">
                <LogoWithFallback size={40} />
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Shehnai.AI
                </span>
              </div>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      activeTab === item.id 
                        ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-md' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex md:w-80 md:flex-col md:fixed md:inset-y-0">
            <div className="flex-1 flex flex-col min-h-0 bg-white shadow-xl">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6 mb-8">
                  <LogoWithFallback size={50} />
                  <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                    Shehnai.AI
                  </span>
                </div>
                <nav className="mt-5 flex-1 px-4 space-y-2">
                  {menuItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl cursor-pointer transition-all duration-200 ${
                        activeTab === item.id 
                          ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg transform scale-105' 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 hover:text-orange-700'
                      }`}
                    >
                      <item.icon 
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          activeTab === item.id ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'
                        }`} 
                      />
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="md:pl-80 flex flex-col flex-1">
            <main className="flex-1">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/preferences" element={<WeddingPreferences />} />
                    <Route path="/budget" element={<BudgetManagement />} />
                    <Route path="/vendor-discovery" element={<VendorDiscovery />} />
                    <Route path="/vendor-communication" element={<VendorCommunication />} />
                    <Route path="/ai-assistant" element={<AIChat />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </div>
        <AIChatWidget />
      </div>
    </BrowserRouter>
  );
};

export default App;
