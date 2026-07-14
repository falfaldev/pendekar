import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { Profile } from '../services/api';
import { 
  LayoutDashboard, BookOpen, Award, Flame, Star, 
  HelpCircle, ShieldCheck, Heart, User, LogOut, Menu, X, Bell, Sparkles, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserLayoutProps {
  user: Profile;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function UserLayout({ user, onLogout, children }: UserLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/materi', label: 'Materi Edukasi', icon: BookOpen },
    { to: '/quiz', label: 'Quiz Harian', icon: Award },
    { to: '/game', label: 'Game Edukasi', icon: ShieldCheck },
    { to: '/leaderboard', label: 'Leaderboard', icon: Star },
    { to: '/konsultasi', label: 'Konsultasi', icon: HelpCircle },
    { to: '/layanan', label: 'Informasi Layanan', icon: Heart },
    { to: '/profile', label: 'Profil Saya', icon: User }
  ];

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await api.getNotifications(5);
        setNotifications(data);
        setUnreadCount(data.length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
    window.addEventListener('pendekar-profile-updated', loadNotifications);

    return () => {
      window.removeEventListener('pendekar-profile-updated', loadNotifications);
    };
  }, []);

  const handleOpenNotification = () => {
    setIsNotificationOpen(prev => !prev);
    // Mark all as read — reset badge count
    if (!isNotificationOpen) {
      setUnreadCount(0);
    }
  };

  // Calculate level progress percentage
  // XP ranges from 0 to 1000 per level
  const xpInCurrentLevel = user.xp % 1000;
  const levelProgress = (xpInCurrentLevel / 1000) * 100;

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      {/* Brand logo */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-1">
          <img src="/logo-pendekar.svg" alt="Logo PENDEKAR" className="w-full h-full object-contain drop-shadow-sm" />
        </div>
        <div>
          <h1 className="font-headline-md text-xl font-extrabold text-white leading-none">PENDEKAREMAJA</h1>
          <p className="text-white/80 text-[8px] tracking-[0.12em] uppercase font-bold mt-1 leading-tight max-w-[150px]">
            Pelayanan Edukasi dan Kesehatan Reproduksi Remaja
          </p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container active-nav-glow scale-95'
                  : 'text-on-primary/70 hover:text-white hover:bg-primary-container/20 hover:scale-[1.02]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-body-md">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer Card */}
      <div className="px-4 mt-auto pt-6 space-y-4">
        <div className="bg-primary-container/40 rounded-2xl p-4 border border-white/10 relative overflow-hidden">
          <p className="text-white font-bold text-sm mb-1">Halo, {user.name}!</p>
          <p className="text-white/60 text-xs mb-3">Level {user.level}</p>
          <div className="w-full bg-black/20 h-1.5 rounded-full mb-1">
            <div 
              className="bg-tertiary-fixed-dim h-full rounded-full shadow-[0_0_8px_rgba(238,194,0,0.5)] transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-white/70 text-right">{xpInCurrentLevel} / 1000 XP</p>
        </div>

        <button
          onClick={handleLogoutClick}
          className="w-full text-on-primary/70 hover:text-white flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-500/10 hover:text-red-300 font-bold"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex font-body-md">
      {/* Desktop Sidebar (Left-fixed) */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-[4px_0_15px_rgba(79,70,229,0.1)] hidden lg:block z-30">
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
              className="fixed left-0 top-0 w-[280px] h-screen bg-primary z-50 lg:hidden"
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
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-headline-sm text-lg font-bold text-primary">Halo, {user.name}! 👋</h2>
              <p className="text-on-surface-variant text-xs font-body-md">
                Terus belajar, jaga diri, dan jadilah remaja cerdas peduli kesehatan!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Points Badge */}
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-low px-3 py-2 rounded-full border border-outline-variant/30 transition-colors cursor-pointer active:opacity-75 min-h-[40px]"
            >
              <Star className="w-4 h-4 text-tertiary-fixed-dim fill-current" />
              <span className="font-bold text-xs md:text-sm text-primary">{user.points} Pts</span>
            </div>

            {/* Streak Badge — sembunyikan di layar sangat kecil */}
            <div 
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-low px-3 py-2 rounded-full border border-outline-variant/30 transition-colors cursor-pointer active:opacity-75 min-h-[40px]"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-current" />
              <span className="font-bold text-xs md:text-sm text-primary">{user.streak} Streak</span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={handleOpenNotification}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-surface-container rounded-full relative hover:bg-surface-container-low transition-colors active:opacity-75"
              >
                <Bell className="w-5 h-5 text-on-surface-variant" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-error text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden z-30"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                      <div>
                        <p className="font-bold text-sm text-on-surface">Notifikasi</p>
                        <p className="text-[10px] text-on-surface-variant">Aktivitas, misi, dan pengingat hari ini</p>
                      </div>
                      <button
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-xs font-bold text-primary hover:text-indigo-700"
                      >
                        Tutup
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-on-surface-variant">
                          Belum ada notifikasi untuk saat ini.
                        </div>
                      ) : (
                        notifications.map((item) => {
                          // Support both shaped notifications and raw aktivitas rows
                          const title = item.title || item.tipe_aktivitas || 'Aktivitas';
                          const message = item.message || item.detail || '';
                          const type = item.type || 'activity';
                          return (
                            <div key={item.id} className="flex gap-3 px-4 py-3 border-b border-outline-variant/10 last:border-b-0 hover:bg-slate-50">
                              <div className={`mt-0.5 rounded-full p-2 shrink-0 ${type === 'mission' ? 'bg-emerald-50 text-emerald-600' : type === 'reminder' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                {type === 'mission' ? <CheckCircle2 className="w-4 h-4" /> : type === 'reminder' ? <Sparkles className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-on-surface">{title}</p>
                                {message && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{message}</p>}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar Profile */}
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 pl-3 md:pl-4 border-l border-outline-variant/30 cursor-pointer group shrink-0"
            >
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                alt={user.name}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-primary/20 group-hover:border-primary transition-all object-cover"
              />
              <div className="text-left hidden md:block">
                <p className="font-bold text-xs text-on-surface leading-tight">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant">Lvl {user.level}</p>
              </div>
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
