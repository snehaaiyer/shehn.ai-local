import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Search, DollarSign, Heart, MessageCircle, 
  X, Settings, User, LogOut, Sun, Moon, Calendar
} from "lucide-react";
import { useAppStore } from '../store/useAppStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <Home className="h-5 w-5" /> },
  { name: 'Wedding Preferences', href: '/preferences', icon: <Heart className="h-5 w-5" /> },
  { name: 'Vendor Discovery', href: '/vendors', icon: <Search className="h-5 w-5" /> },
  { name: 'Budget Management', href: '/budget', icon: <DollarSign className="h-5 w-5" /> },
  { name: 'Bid AI', href: '/chat', icon: <MessageCircle className="h-5 w-5" /> },
  { name: 'Google Integration', href: '/google-integration', icon: <Calendar className="h-5 w-5" /> },
];

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  }
};

const overlayVariants = {
  open: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  },
  closed: {
    opacity: 0,
    transition: {
      duration: 0.3
    }
  }
};

const menuItemVariants = {
  open: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: i * 0.1,
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  }),
  closed: {
    x: -50,
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

export const AnimatedSidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 lg:hidden"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className={`flex h-full flex-col shadow-2xl border-r transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Header */}
              <motion.div 
                className={`flex h-16 items-center justify-between px-6 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                custom={0}
                variants={menuItemVariants}
              >
                <h2 className={`text-lg font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-deep-navy'}`}>
                  BID AI Wedding
                </h2>
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-pastel-rose/20 text-deep-navy'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    custom={index + 1}
                    variants={menuItemVariants}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                            location.pathname === item.href
                      ? theme === 'dark' ? 'text-white shadow-lg' : 'bg-salmon-pink text-white shadow-lg'
                      : theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'
                      }`}
                    >
                      <motion.div
                        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${theme === 'dark' ? 'bg-gray-700' : 'bg-salmon-pink'}`}
                        initial={false}
                      />
                      <span className="relative z-10">{item.icon}</span>
                      <span className="relative z-10 font-medium">{item.name}</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer */}
              <motion.div 
                className={`border-t p-4 space-y-2 transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                custom={navigation.length + 1}
                variants={menuItemVariants}
              >
                <motion.button
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </motion.button>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}>
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}>
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}>
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div 
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <div className={`flex flex-col flex-grow shadow-xl border-r transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`flex h-16 items-center px-6 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-deep-navy'}`}>
              BID AI Wedding
            </h2>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    location.pathname === item.href
                      ? theme === 'dark' ? 'text-white shadow-lg' : 'bg-salmon-pink text-white shadow-lg'
                      : theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'
                  }`}
                >
                  <motion.div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${theme === 'dark' ? 'bg-gray-700' : 'bg-salmon-pink'}`}
                    initial={false}
                  />
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10 font-medium">{item.name}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
          <motion.div 
            className={`border-t p-4 space-y-2 transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <motion.button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </motion.button>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}>
              <User className="h-5 w-5" />
              <span>Profile</span>
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}>
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </div>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-deep-navy hover:bg-pastel-rose/20'}`}>
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}; 