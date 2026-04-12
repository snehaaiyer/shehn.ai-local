import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, DollarSign, Heart, MessageCircle,
  X, Settings, Sun, Moon, Mail, FileText, IndianRupee,
  Bot, Store, User, Users, CheckCircle, Sparkles, Calendar
} from "lucide-react";
import { useAppStore } from '../store/useAppStore';

// Logo component with proper React fallback
const LogoWithFallback: React.FC<{ size?: string }> = ({ size = "w-10 h-10" }) => {
  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return (
      <div className="w-10 h-10 mr-3 bg-salmon-pink rounded-full flex items-center justify-center text-white font-bold text-lg">
        S
      </div>
    );
  }

  return (
    <img
      src="/shehnai-logo.png"
      alt="Shehnai.AI"
      className="w-10 h-10 mr-3"
      onError={() => setImageError(true)}
    />
  );
};


interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const coupleNav: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <Home className="h-5 w-5" /> },
  { name: 'AI Planner', href: '/plan', icon: <Sparkles className="h-5 w-5" /> },
  { name: 'Preferences', href: '/preferences', icon: <Heart className="h-5 w-5" /> },
  { name: 'Blueprint', href: '/blueprint', icon: <FileText className="h-5 w-5" /> },
  { name: 'Find Vendors', href: '/vendors', icon: <Search className="h-5 w-5" /> },
  { name: 'Quotes', href: '/quotes', icon: <IndianRupee className="h-5 w-5" /> },
  { name: 'Messages', href: '/messages', icon: <MessageCircle className="h-5 w-5" /> },
  { name: 'Budget', href: '/budget', icon: <DollarSign className="h-5 w-5" /> },
  { name: 'Timeline', href: '/timeline', icon: <Calendar className="h-5 w-5" /> },
  { name: 'Invites & RSVP', href: '/wedding-invites', icon: <Mail className="h-5 w-5" /> },
];

const vendorNav: NavItem[] = [
  { name: 'Dashboard', href: '/vendor/dashboard', icon: <Home className="h-5 w-5" /> },
  { name: 'Marketplace', href: '/vendor/marketplace', icon: <Store className="h-5 w-5" /> },
  { name: 'My Profile', href: '/vendor/profile', icon: <User className="h-5 w-5" /> },
  { name: 'Inbox', href: '/vendor/inbox', icon: <MessageCircle className="h-5 w-5" /> },
];

const adminNav: NavItem[] = [
  { name: 'Vendor Approvals', href: '/admin/vendors', icon: <CheckCircle className="h-5 w-5" /> },
  { name: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
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

const NavLinks: React.FC<{
  navigation: NavItem[];
  theme: string;
  pathname: string;
  onItemClick?: () => void;
  animated?: boolean;
}> = ({ navigation, theme, pathname, onItemClick, animated = false }) => (
  <>
    {navigation.map((item, index) => {
      const inner = (
        <Link
          to={item.href}
          onClick={onItemClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
            pathname === item.href
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
      );

      if (animated) {
        return (
          <motion.div key={item.name} custom={index + 1} variants={menuItemVariants}>
            {inner}
          </motion.div>
        );
      }
      return (
        <motion.div
          key={item.name}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          {inner}
        </motion.div>
      );
    })}
  </>
);

export const AnimatedSidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme, currentRole, setRole, setUserId, currentUserId } = useAppStore();

  const navigation = currentRole === 'vendor' ? vendorNav : currentRole === 'superadmin' ? adminNav : coupleNav;

  // Auto-set userId when switching roles
  const handleRoleSwitch = (role: 'couple' | 'vendor' | 'superadmin') => {
    setRole(role);
    if (role === 'vendor') {
      // Default test vendor: Ashirwad Caterers Bangalore (ID=11, catering)
      setUserId(11);
    } else if (role === 'couple') {
      setUserId(1);
    } else {
      setUserId(99); // Admin
    }
  };

  const roleLabel = currentRole === 'vendor' ? 'Vendor' : currentRole === 'superadmin' ? 'Admin' : 'Couple';

  const footerContent = (animated: boolean) => (
    <>
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
        <Settings className="h-5 w-5" />
        <span>Settings</span>
      </div>
      {/* Role Switcher (Dev) */}
      <div className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <label className={`text-xs block mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Switch Role (Dev)
        </label>
        <select
          value={currentRole}
          onChange={(e) => handleRoleSwitch(e.target.value as 'couple' | 'vendor' | 'superadmin')}
          className={`w-full text-sm border rounded px-2 py-1 ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}
        >
          <option value="couple">Couple</option>
          <option value="vendor">Vendor (Ashirwad Caterers)</option>
          <option value="superadmin">Admin</option>
        </select>
        {currentRole === 'vendor' && (
          <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            ID: {currentUserId} · Catering · Bangalore
          </div>
        )}
      </div>
    </>
  );

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
                <div className="flex items-center space-x-3">
                  <LogoWithFallback size="h-10 w-auto" />
                </div>
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-pastel-rose/20 text-deep-navy'}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Role Badge */}
              <div className={`px-6 py-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {roleLabel} View
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
                <NavLinks navigation={navigation} theme={theme} pathname={location.pathname} onItemClick={() => setSidebarOpen(false)} animated />
              </nav>

              {/* Footer */}
              <motion.div
                className={`border-t p-4 space-y-2 transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                custom={navigation.length + 1}
                variants={menuItemVariants}
              >
                {footerContent(true)}
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
            <div className="flex items-center space-x-3">
              <LogoWithFallback size="h-10 w-auto" />
            </div>
          </div>

          {/* Role Badge */}
          <div className={`px-6 py-2 text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {roleLabel} View
          </div>

          <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
            <NavLinks navigation={navigation} theme={theme} pathname={location.pathname} />
          </nav>

          <motion.div
            className={`border-t p-4 space-y-2 transition-colors duration-300 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            {footerContent(false)}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
