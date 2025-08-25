
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

const AnimatedSidebar = ({ isOpen, onClose, menuItems, activeTab, setActiveTab }: {
  isOpen: boolean;
  onClose: () => void;
  menuItems: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-center mt-8 mb-4">
        <LogoWithFallback size={50} />
        <span className="ml-4 text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
          Shehnai.AI
        </span>
      </div>
      <nav className="px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors ${
                activeTab === item.id
                  ? 'text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              style={activeTab === item.id ? {
                backgroundColor: '#D4A574', // Peach color matching action boxes
                background: 'linear-gradient(135deg, #D4A574, #C49464)'
              } : {}}
            ></div>
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
          );
        })}
      </nav>
      <button onClick={onClose} className="absolute top-3 right-3 lg:hidden">
        <X size={24} />
      </button>
    </div>
  );
};

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');

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
            <span className={`text-xl font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Shehnai.AI
            </span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-900'}`}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar and Main Content */}
        <div className="flex">
          {/* Desktop Sidebar */}
          <AnimatedSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            menuItems={menuItems} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          
          {/* Main Content Area */}
          <div className={`flex-1 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 to-orange-50'}`}>
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
