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
import { AnimatedSidebar } from './components/AnimatedSidebar';
import { useAppStore } from './store/useAppStore';

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
  const { sidebarOpen, setSidebarOpen, theme } = useAppStore();

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

        {/* Sidebar */}
        <AnimatedSidebar />

        {/* Main Content */}
        <div className="lg:pl-64">
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/preferences" element={<WeddingPreferences />} />
              <Route path="/budget" element={<BudgetManagement />} />
              <Route path="/vendors" element={<VendorDiscovery />} />
              <Route path="/vendor-discovery" element={<Navigate to="/vendors" replace />} />
              <Route path="/vendor-communication" element={<VendorCommunication />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="/ai-assistant" element={<Navigate to="/chat" replace />} />
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