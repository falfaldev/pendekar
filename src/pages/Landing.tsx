import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  BookOpen, PlayCircle, HelpCircle, Gamepad2, Award,
  Shield, LogIn, Play, X, Heart, Menu, Users, Trophy,
  CheckCircle2, Star, Zap, ArrowRight, ChevronRight
} from 'lucide-react';
import type { Profile } from '../services/api';

interface LandingProps {
  user: Profile | null;
  onLogout: () => Promise<void>;
}

const FEATURES = [
  { title: 'Materi Edukasi', desc: '7 topik lengkap: HIV, AIDS, penularan, pencegahan ABCDE, stigma, tes VCT, dan pengobatan ART.', icon: BookOpen, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', titleColor: 'text-blue-600', link: '/materi' },
  { title: 'Video & PDF', desc: 'Setiap materi dilengkapi video edukasi dan file PDF yang bisa dibaca langsung di website.', icon: PlayCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', titleColor: 'text-emerald-600', link: '/materi' },
  { title: 'Quiz Interaktif', desc: 'Uji pemahamanmu dengan quiz pilihan ganda, dapat XP & poin, dan lihat skormu langsung.', icon: HelpCircle, iconBg: 'bg-amber-100', iconColor: 'text-amber-500', titleColor: 'text-amber-500', link: '/quiz' },
  { title: '5 Game Edukasi', desc: 'Benar/Salah, Memory Card, Drag & Drop, Tebak Gambar, dan Puzzle — 3 level tiap game.', icon: Gamepad2, iconBg: 'bg-rose-100', iconColor: 'text-rose-500', titleColor: 'text-rose-500', link: '/game' },
  { title: 'Badge & Ranking', desc: '4 badge prestasi, sistem XP & level, misi harian, dan papan peringkat antar remaja.', icon: Trophy, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', titleColor: 'text-violet-600', link: '/leaderboard' },
];

const STATS = [
  { value: '7', label: 'Topik Materi', icon: BookOpen, grad: 'from-blue-500 to-indigo-600' },
  { value: '5', label: 'Game Interaktif', icon: Gamepad2, grad: 'from-emerald-500 to-teal-600' },
  { value: '2', label: 'Kuis Pelajaran', icon: HelpCircle, grad: 'from-amber-400 to-orange-500' },
  { value: '4', label: 'Badge Prestasi', icon: Award, grad: 'from-rose-500 to-pink-600' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Daftar Gratis', desc: 'Buat akun dengan nama, email, dan kata sandi. Langsung masuk tanpa biaya apapun.', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { step: '02', title: 'Baca & Tonton', desc: 'Baca 7 topik materi HIV/AIDS, tonton video edukatif, dan buka file PDF langsung di website.', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { step: '03', title: 'Quiz & Game', desc: 'Kerjakan quiz pilihan ganda dan mainkan 5 game edukasi seru dengan 3 level tantangan.', icon: Gamepad2, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  { step: '04', title: 'Raih Prestasi', desc: 'Kumpulkan XP & poin, buka 4 badge, naiki level, dan raih posisi teratas leaderboard.', icon: Trophy, color: 'text-violet-600 bg-violet-50 border-violet-100' },
];

// Animasi variants yang reusable
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.88 }, show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } } };

export default function Landing({ user, onLogout }: LandingProps) {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const featRef = useRef(null);
  const featInView = useInView(featRef, { once: true, margin: '-80px' });

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden font-sans">

      {/* ══════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════ */}
      <motion.header
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div whileHover={{ rotate: 6, scale: 1.08 }} transition={{ type: 'spring', stiffness: 400 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
              <img src="/logo-pendekar.svg" alt="Logo PENDEKAR" className="w-12 h-12 object-contain drop-shadow-md" />
            </motion.div>
            <div>
              <span className="font-extrabold text-[17px] text-primary tracking-tight leading-none block">PENDEKAR</span>
              <span className="text-[10px] text-slate-500 font-semibold leading-none block mt-0.5">Pelayanan Edukasi dan Kesehatan Reproduksi Remaja</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link to="/dashboard"
                  className="px-5 py-2 rounded-xl border border-slate-200 hover:border-primary text-slate-700 hover:text-primary font-bold text-sm transition-all hover:bg-primary/5">
                  Ke Dashboard
                </Link>
                <button onClick={() => void onLogout()}
                  className="px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-sm transition-colors">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl border border-slate-200 hover:border-primary text-slate-700 hover:text-primary font-bold text-sm transition-all hover:bg-primary/5">
                  <LogIn className="w-4 h-4" /> Masuk
                </Link>
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/register"
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition-all">
                    Daftar Gratis <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-500 hover:text-primary rounded-xl transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-slate-100 bg-white">
              <div className="px-4 py-4 flex flex-col gap-2.5">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="bg-primary text-white text-center py-3 rounded-xl font-bold text-sm shadow-md">Ke Dashboard</Link>
                    <button onClick={() => { setMenuOpen(false); void onLogout(); }} className="border border-red-100 text-red-500 text-center py-3 rounded-xl font-bold text-sm">Keluar</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="border border-slate-200 text-center py-3 rounded-xl font-bold text-sm text-slate-700">Masuk</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="bg-primary text-white text-center py-3 rounded-xl font-bold text-sm shadow-md">Daftar Gratis</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#f8faff] min-h-[580px] flex items-center">
        {/* Background blobs */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-10 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-end">

            {/* ── Kiri: Konten teks ── */}
            <div className="flex flex-col gap-6 pb-16 lg:pb-20">
              {/* Pill badge */}
              <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0 }}
                className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-100 px-4 py-2 rounded-full w-fit shadow-sm">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-indigo-700 font-bold text-xs">Belajar • Pahami • Lindungi Diri</span>
              </motion.div>

              {/* Headline */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
                  className="font-extrabold text-[2.6rem] sm:text-5xl lg:text-[3.2rem] leading-[1.15] text-slate-900 tracking-tight"
                >
                  Belajar Kesehatan,<br />
                  Cegah Risiko,<br />
                  <span className="text-primary relative">
                    Jadi Remaja Peduli
                    <motion.span
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                      transition={{ delay: 0.7, duration: 0.5, ease: 'easeOut' }}
                      className="absolute -bottom-1 left-0 w-full h-1 bg-primary/25 rounded-full origin-left block"
                    />
                  </span>
                </motion.h1>
              </motion.div>

              {/* Deskripsi */}
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-slate-600 text-base sm:text-lg max-w-lg leading-relaxed">
                PENDEKAR adalah platform edukasi interaktif untuk membantu remaja memahami HIV/AIDS dengan cara yang mudah, terpercaya, dan menyenangkan.
              </motion.p>

              {/* Checkmarks cepat */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-x-6 gap-y-2">
                {['Gratis Selamanya', 'Materi Terpercaya', 'Belajar Sambil Main'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {t}
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-3 pt-1">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(user ? '/dashboard' : '/register')}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-2xl shadow-primary/30 text-sm"
                >
                  <BookOpen className="w-4 h-4" /> Mulai Belajar Sekarang
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowVideo(true)}
                  className="bg-white/90 backdrop-blur-sm border border-slate-200 hover:border-slate-300 text-slate-800 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-md text-sm"
                >
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                  Tonton Video Trailer
                </motion.button>
              </motion.div>
            </div>

            {/* ── Kanan: Gambar karakter ── */}
            <div className="relative flex items-center justify-center h-[460px] lg:h-[520px]">
              {/* Lingkaran biru besar di belakang */}
              <div className="absolute inset-0 m-auto w-[400px] h-[400px] bg-blue-200/60 rounded-full blur-xl pointer-events-none" />
              <div className="absolute inset-0 m-auto w-[280px] h-[280px] bg-indigo-100/80 rounded-full pointer-events-none" />

              {/* Gambar utama — floating animation */}
              <motion.img
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                src="/landing-mascot.png"
                alt="Karakter Remaja PENDEKAR"
                className="relative z-10 h-[420px] lg:h-[480px] w-auto object-contain object-center select-none"
                style={{
                  filter: 'drop-shadow(0 20px 36px rgba(79,70,229,0.20))',
                  animation: 'floatY 4s ease-in-out infinite',
                }}
              />

              {/* Floating card kiri bawah */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="absolute bottom-10 left-0 lg:-left-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 z-20"
              >
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-none">Pengetahuan hari ini,</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">perlindungan untuk esok hari.</p>
                </div>
              </motion.div>

              {/* Floating badge kanan atas */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.85, duration: 0.5 }}
                className="absolute top-8 right-0 lg:-right-2 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-2.5 z-20"
              >
                <div className="w-8 h-8 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-none">+50 XP</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">per materi selesai</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CSS untuk animasi float */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>

      {/* ══════════════════════════════════════
          STATS MINI BAR
      ══════════════════════════════════════ */}
      <section className="py-10 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {STATS.map((s, i) => (
              <motion.div key={i} variants={scaleIn}
                className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shrink-0 shadow-md`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-2xl text-slate-800 leading-none">{s.value}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FITUR SECTION
      ══════════════════════════════════════ */}
      <section ref={featRef} className="py-20 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={featInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Platform Edukasi</span>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-slate-900 mt-2">Kenapa Belajar di PENDEKAR?</h2>
            <div className="w-14 h-1.5 bg-primary rounded-full mx-auto mt-4" />
          </motion.div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={featInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px -8px rgba(79,70,229,0.15)' }}
                onClick={() => navigate(user ? f.link : '/register')}
                className="bg-white border border-slate-100 rounded-3xl p-7 flex flex-col gap-4 cursor-pointer transition-all group"
              >
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center mx-auto shadow-sm`}
                >
                  <f.icon className={`w-7 h-7 ${f.iconColor}`} />
                </motion.div>
                <h3 className={`font-bold text-sm text-center ${f.titleColor}`}>{f.title}</h3>
                <p className="text-slate-500 text-xs text-center leading-relaxed">{f.desc}</p>
                <div className={`flex items-center justify-center gap-1 text-xs font-bold mt-auto ${f.titleColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Mulai <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CARA KERJA (HOW IT WORKS)
      ══════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="text-emerald-600 font-bold text-sm uppercase tracking-widest">Cara Mudah</span>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-slate-900 mt-2">Mulai Belajar dalam 4 Langkah</h2>
            <div className="w-14 h-1.5 bg-emerald-500 rounded-full mx-auto mt-4" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Garis koneksi horizontal (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-emerald-200 to-violet-200 z-0" />

            {HOW_IT_WORKS.map((h, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }}
                className="flex flex-col items-center text-center gap-4 relative z-10"
              >
                <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-sm ${h.color} relative`}>
                  <h.icon className="w-9 h-9" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-slate-800 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                    {h.step}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">{h.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-indigo-700">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-2xl pointer-events-none -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto border border-white/20"
          >
            <Zap className="w-8 h-8 text-white fill-white/30" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}
            className="font-extrabold text-3xl sm:text-4xl text-white leading-tight"
          >
            Siap Jadi Remaja Cerdas<br />Peduli Kesehatan?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-indigo-100 text-base leading-relaxed max-w-xl mx-auto"
          >
            Bergabunglah dengan PENDEKAR. Belajar HIV/AIDS dengan cara yang menyenangkan, aman, dan terpercaya — gratis selamanya.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              className="bg-white text-primary font-bold text-sm px-10 py-4 rounded-2xl shadow-2xl inline-flex items-center gap-3"
            >
              <BookOpen className="w-5 h-5" />
              {user ? 'Ke Dashboard Saya' : 'Daftar Sekarang — Gratis!'}
            </motion.button>
            <button onClick={() => setShowVideo(true)}
              className="flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm transition-colors">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              Tonton Trailer
            </button>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
              <img src="/logo-pendekar.svg" alt="Logo PENDEKAR" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white">PENDEKAR</span>
              <span className="text-slate-400 text-[10px] font-medium ml-2">Pelayanan Edukasi dan Kesehatan Reproduksi Remaja</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs">© {new Date().getFullYear()} PENDEKAR. Platform edukasi HIV/AIDS untuk remaja Indonesia.</p>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Dibuat dengan cinta untuk remaja Indonesia</span>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════
          VIDEO MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {showVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVideo(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="relative w-full max-w-4xl bg-slate-950 rounded-3xl overflow-hidden shadow-2xl z-10 border border-white/10"
            >
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full border border-white/20 transition-colors backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </motion.button>
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/2gfsHCoylFg?autoplay=1&rel=0"
                  title="Video Trailer PENDEKAR"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
