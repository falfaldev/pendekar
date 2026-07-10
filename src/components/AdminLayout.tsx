import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { Profile } from '../services/api';
import { 
  ShieldAlert, LayoutDashboard, Users, BookOpen, Award, 
  Heart, HelpCircle, LogOut, Menu, X, ArrowLeftRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLayoutProps {
  user: Profile;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({ user, onLogout, children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard Admin', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'Kelola Pengguna', icon: Users },
    { to: '/admin/materi', label: 'Kelola Materi', icon: BookOpen },
    { to: '/admin/quiz', label: 'Kelola Quiz', icon: Award },
    { to: '/admin/layanan', label: 'Kelola Layanan', icon: Heart },
    { to: '/admin/konsultasi', label: 'Konsultasi Masuk', icon: HelpCircle }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      {/* Brand logo */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-sm shrink-0">
          <ShieldAlert className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="font-headline-md text-xl font-extrabold text-white leading-none">PENDEKAR</h1>
          <p className="text-red-100 text-[10px] tracking-[0.22em] uppercase font-bold mt-1">
            Panel Administrasi
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to);
            
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive
                  ? 'bg-red-700 text-white shadow-lg shadow-red-900/30 scale-95'
                  : 'text-white/70 hover:text-white hover:bg-red-800/30 hover:scale-[1.02]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-body-md">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="px-4 mt-auto pt-6 space-y-4">
        {/* Switch back to user role quick trigger */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-xs"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Lihat Mode Remaja
        </button>

        <button
          onClick={handleLogoutClick}
          className="w-full text-white/70 hover:text-white flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-900/40 hover:text-red-200 font-bold"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Keluar Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-[#191c1e] flex font-body-md">
      {/* Desktop Sidebar (Left-fixed) */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-slate-900 shadow-[4px_0_15px_rgba(15,23,42,0.1)] hidden lg:block z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 w-[280px] h-screen bg-slate-900 z-50 lg:hidden"
            >
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Wrapper */}
      <div className="flex-1 lg:pl-[280px] min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="font-headline-sm text-lg font-bold text-red-600 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Panel Admin
              </h2>
              <p className="text-slate-500 text-xs hidden sm:block">
                Kelola materi edukasi, kuis, daftar pengguna, dan jawab tiket konsultasi remaja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="font-bold text-xs text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Super Administrator</p>
              </div>
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150'}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-red-600/30 object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content area */}
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
