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
import { AIChatWidget } from './components/AIChatWidget';

// CSS
import './App.css';

// Placeholder for AnimatedSidebar and theme, as they are not provided in the original code.
// In a real scenario, these would be imported and managed.
const AnimatedSidebar = ({ isOpen, onClose }) => {
  // Dummy implementation for demonstration
  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ${isOpen ? '' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center justify-center mt-8 mb-4">
        <LogoWithFallback size={50} />
        <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
          Shehnai.AI
        </span>
      </div>
      <nav className="px-4 space-y-2">
        {/* Dummy menu items */}
        <div className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer hover:bg-gray-100 text-gray-700">
          <Home size={20} />
          <span className="font-medium">Dashboard</span>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer hover:bg-gray-100 text-gray-700">
          <Heart size={20} />
          <span className="font-medium">Preferences</span>
        </div>
      </nav>
      <button onClick={onClose} className="absolute top-3 right-3 lg:hidden">
        <X size={24} />
      </button>
    </div>
  );
};

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
  // These states are assumed to be managed by AnimatedSidebar and theme context
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'preferences', label: 'Wedding Preferences', icon: Heart, path: '/preferences' },
    { id: 'budget', label: 'Budget Management', icon: DollarSign, path: '/budget' },
    { id: 'vendor-discovery', label: 'Vendor Discovery', icon: Search, path: '/vendor-discovery' },
    { id: 'vendor-communication', label: 'Vendor Communication', icon: MessageCircle, path: '/vendor-communication' },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, path: '/ai-assistant' }
  ];

  return (
    <BrowserRouter>
      <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 to-orange-50'}`}>
        
        {/* Mobile Header */}
        <div className={`lg:hidden shadow-sm border-b px-4 py-3 flex items-center justify-between transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <LogoWithFallback size={32} />
            <span className={`text-xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-deep-navy'}`}>
              Shehnai.AI
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-pastel-rose/20 text-deep-navy'}`}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Sidebar and Main Content */}
        <div className="flex">
          {/* Desktop Sidebar */}
          {/* Assuming AnimatedSidebar takes props like isOpen, onClose, menuItems, activeTab, setActiveTab */}
          <AnimatedSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} activeTab={'dashboard'} setActiveTab={() => {}} />
          
          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 to-orange-50'}`}>
            {/* Mobile Header (already defined above, but the original snippet had it here again) */}
            {/* Re-integrating based on the provided snippet's structure */}
            <div className={`lg:hidden shadow-sm border-b px-4 py-3 flex items-center justify-between transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <LogoWithFallback size={32} />
                <span className={`text-xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-deep-navy'}`}>
                  Shehnai.AI
                </span>
              </div>
              <button 
                onClick={() => setSidebarOpen(true)}
                className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-pastel-rose/20 text-deep-navy'}`}
              >
                <Menu size={24} />
              </button>
            </div>

            {/* Page Content */}
            <main className="flex-1 p-4 lg:p-8">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/preferences" element={<WeddingPreferences />} />
                <Route path="/budget" element={<BudgetManagement />} />
                <Route path="/vendor-discovery" element={<VendorDiscovery />} />
                <Route path="/vendor-communication" element={<VendorCommunication />} />
                <Route path="/ai-assistant" element={<AIChat />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
        <AIChatWidget />
      </div>
    </BrowserRouter>
  );
};

export default App;