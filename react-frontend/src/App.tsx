import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

// Page imports
import Index from './pages/Index';
import WeddingPreferences from './pages/WeddingPreferences';
import BudgetManagement from './pages/BudgetManagement';
import VendorDiscovery from './pages/VendorDiscovery';
import VendorCommunication from './pages/VendorCommunication';
import AIChat from './pages/AIChat';

// Component imports
import { AnimatedSidebar } from './components/AnimatedSidebar';
import AIChatWidget from './components/AIChatWidget';
import { useAppStore } from './store/useAppStore';

// CSS
import './App.css';



function App() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        >
          <Menu size={24} />
        </button>

        {/* Animated Sidebar */}
        <AnimatedSidebar />

        {/* Main Content */}
        <div className="lg:pl-64">
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/preferences" element={<WeddingPreferences />} />
              <Route path="/budget" element={<BudgetManagement />} />
              <Route path="/vendors" element={<VendorDiscovery />} />
              <Route path="/vendor-communication" element={<VendorCommunication />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* AI Chat Widget */}
        <AIChatWidget />
      </div>
    </BrowserRouter>
  );
}

export default App;