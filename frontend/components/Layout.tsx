import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  BookOpen,
  UploadCloud,
  Users as UsersIcon,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Calendar,
  Megaphone,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    // Get user details from localStorage
    const userJson = localStorage.getItem('adminUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setAdminEmail(user.email);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Sync and manage dark mode classes dynamically
  useEffect(() => {
    const applyTheme = () => {
      const saved = localStorage.getItem('darkMode');
      const isDark = saved ? saved === 'true' : true; // Default to dark theme
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();
    window.addEventListener('theme-changed', applyTheme);
    return () => {
      window.removeEventListener('theme-changed', applyTheme);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Questions', path: '/admin/questions', icon: BookOpen },
    { name: 'CSV/Excel Import', path: '/admin/upload', icon: UploadCloud },
    { name: 'User Management', path: '/admin/users', icon: UsersIcon },
    { name: 'Test Series', path: '/admin/tests', icon: Calendar },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 shrink-0 h-full">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none tracking-tight">NEET PYQ</h1>
            <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500">
              Admin Portal
            </span>
          </div>
        </div>

        {/* User Info Quick View */}
        <div className="p-4 mx-3 my-3 bg-neutral-50 rounded-xl dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-900">
          <p className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Logged In As
          </p>
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
            {adminEmail || 'admin@neetplatform.com'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Back Drop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-neutral-900/60 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col md:hidden"
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-bold text-sm leading-none">NEET PYQ</h1>
                  <span className="text-[10px] uppercase font-semibold text-neutral-400">Admin</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 mx-3 my-3 bg-neutral-50 rounded-xl dark:bg-neutral-950/50 border border-neutral-100 dark:border-neutral-900">
              <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Logged In As</p>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                {adminEmail || 'admin@neetplatform.com'}
              </p>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
              Admin Connection Secured
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 leading-none">System Status</p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Database Sync: Active
              </p>
            </div>
          </div>
        </header>

        {/* Active Route Frame */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
