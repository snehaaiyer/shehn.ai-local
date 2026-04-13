import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, DollarSign, Heart, MessageCircle,
  X, Settings, Sun, Moon, Mail, FileText, IndianRupee,
  Bot, Store, User, Users, CheckCircle, Sparkles, Calendar,
  ChevronRight
} from "lucide-react";
import { useAppStore } from '../store/useAppStore';

// ── Logo ──
const LogoWithFallback: React.FC<{ size?: string; showFull?: boolean }> = ({ size = "w-8 h-8", showFull = false }) => {
  const [imageError, setImageError] = React.useState(false);

  if (imageError) {
    return (
      <div className={`${size} rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-rose`}>
        S
      </div>
    );
  }

  // Use the SVG app icon (infinity symbol) for compact logo
  return (
    <img
      src={showFull ? "/shehnai-logo.svg" : "/shehnai-icon.svg"}
      alt="Shehn.AI"
      className={showFull ? "h-8" : `${size} rounded-xl`}
      onError={() => setImageError(true)}
    />
  );
};

// ── Nav Definitions ──
interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const coupleNav: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <Home className="h-[18px] w-[18px]" /> },
  { name: 'AI Planner', href: '/plan', icon: <Sparkles className="h-[18px] w-[18px]" /> },
  { name: 'Preferences', href: '/preferences', icon: <Heart className="h-[18px] w-[18px]" /> },
  { name: 'Blueprint', href: '/blueprint', icon: <FileText className="h-[18px] w-[18px]" /> },
  { name: 'Find Vendors', href: '/vendors', icon: <Search className="h-[18px] w-[18px]" /> },
  { name: 'Quotes', href: '/quotes', icon: <IndianRupee className="h-[18px] w-[18px]" /> },
  { name: 'Messages', href: '/messages', icon: <MessageCircle className="h-[18px] w-[18px]" /> },
  { name: 'Budget', href: '/budget', icon: <DollarSign className="h-[18px] w-[18px]" /> },
  { name: 'Timeline', href: '/timeline', icon: <Calendar className="h-[18px] w-[18px]" /> },
  { name: 'Invites', href: '/wedding-invites', icon: <Mail className="h-[18px] w-[18px]" /> },
];

const vendorNav: NavItem[] = [
  { name: 'Dashboard', href: '/vendor/dashboard', icon: <Home className="h-[18px] w-[18px]" /> },
  { name: 'Marketplace', href: '/vendor/marketplace', icon: <Store className="h-[18px] w-[18px]" /> },
  { name: 'My Calendar', href: '/vendor/calendar', icon: <Calendar className="h-[18px] w-[18px]" /> },
  { name: 'My Profile', href: '/vendor/profile', icon: <User className="h-[18px] w-[18px]" /> },
  { name: 'Inbox', href: '/vendor/inbox', icon: <MessageCircle className="h-[18px] w-[18px]" /> },
];

const adminNav: NavItem[] = [
  { name: 'Approvals', href: '/admin/vendors', icon: <CheckCircle className="h-[18px] w-[18px]" /> },
  { name: 'Users', href: '/admin/users', icon: <Users className="h-[18px] w-[18px]" /> },
];

// ── Animation Variants ──
const sidebarVariants = {
  open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
};

const overlayVariants = {
  open: { opacity: 1, transition: { duration: 0.25 } },
  closed: { opacity: 0, transition: { duration: 0.25 } },
};

// ── Nav Link Component ──
const NavLink: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  delay?: number;
  isDark?: boolean;
}> = ({ item, isActive, onClick, delay = 0, isDark = false }) => (
  <motion.div
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay, duration: 0.25, ease: 'easeOut' }}
  >
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative ${
        isActive
          ? 'bg-rose-500 text-white shadow-glow-rose'
          : isDark
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-500'
        }`}>
          {item.badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-white/40"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  </motion.div>
);

// ── Sidebar Content ──
const SidebarContent: React.FC<{
  navigation: NavItem[];
  pathname: string;
  theme: string;
  currentRole: string;
  currentUserId: number;
  onItemClick?: () => void;
  onToggleTheme: () => void;
  onRoleSwitch: (role: 'couple' | 'vendor' | 'superadmin') => void;
}> = ({ navigation, pathname, theme, currentRole, currentUserId, onItemClick, onToggleTheme, onRoleSwitch }) => {
  const roleLabel = currentRole === 'vendor' ? 'Vendor' : currentRole === 'superadmin' ? 'Admin' : 'Couple';
  const roleColor = currentRole === 'vendor' ? 'bg-blue-50 text-blue-600' : currentRole === 'superadmin' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600';

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Logo + Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <LogoWithFallback size="w-9 h-9" />
          <div>
            <h1 className={`text-base font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Shehn<span className="text-rose-500">.AI</span>
            </h1>
            <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0 rounded-full border ${
              theme === 'dark'
                ? roleColor.replace('bg-rose-50', 'bg-rose-900/30').replace('text-rose-600', 'text-rose-400')
                : roleColor
            }`}>{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className={`mx-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navigation.map((item, index) => (
          <NavLink
            key={item.name}
            item={item}
            isActive={pathname === item.href}
            onClick={onItemClick}
            delay={index * 0.03}
            isDark={theme === 'dark'}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t px-3 py-3 space-y-1 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {/* Dev Role Switcher */}
        <div className={`px-3 py-2.5 rounded-xl ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <label className={`text-[10px] font-medium uppercase tracking-wider block mb-1.5 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Dev Mode
          </label>
          <select
            value={currentRole}
            onChange={(e) => onRoleSwitch(e.target.value as any)}
            className={`w-full text-xs border rounded-lg px-2 py-1.5 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            <option value="couple">Couple</option>
            <option value="vendor">Vendor (Ashirwad)</option>
            <option value="superadmin">Admin</option>
          </select>
          {currentRole === 'vendor' && (
            <p className={`mt-1 text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              ID: {currentUserId} · Catering · Bangalore
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Sidebar Export ──
export const AnimatedSidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, theme, toggleTheme, currentRole, setRole, setUserId, currentUserId } = useAppStore();

  const navigation = currentRole === 'vendor' ? vendorNav : currentRole === 'superadmin' ? adminNav : coupleNav;

  const handleRoleSwitch = (role: 'couple' | 'vendor' | 'superadmin') => {
    setRole(role);
    if (role === 'vendor') setUserId(11);
    else if (role === 'couple') setUserId(1);
    else setUserId(99);
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
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-y-0 left-0 z-50 w-[260px] lg:hidden"
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="h-full shadow-elevated border-r border-gray-100 bg-white overflow-hidden">
              <div className="absolute top-4 right-3 z-10">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <SidebarContent
                navigation={navigation}
                pathname={location.pathname}
                theme={theme}
                currentRole={currentRole}
                currentUserId={currentUserId}
                onItemClick={() => setSidebarOpen(false)}
                onToggleTheme={toggleTheme}
                onRoleSwitch={handleRoleSwitch}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col z-30"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col flex-grow border-r border-gray-100 bg-white overflow-hidden">
          <SidebarContent
            navigation={navigation}
            pathname={location.pathname}
            theme={theme}
            currentRole={currentRole}
            currentUserId={currentUserId}
            onToggleTheme={toggleTheme}
            onRoleSwitch={handleRoleSwitch}
          />
        </div>
      </motion.div>
    </>
  );
};
