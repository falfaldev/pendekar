import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Profile } from '../services/api';
import { 
  BookOpen, Award, Gamepad2, HelpCircle, Heart, 
  Lightbulb, ChevronRight, CheckCircle2, AlertCircle, ArrowRight, Star
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [materialsCount, setMaterialsCount] = useState({ completed: 0, total: 0 });
  const [gamesCount, setGamesCount] = useState({ completed: 0, total: 0 });
  const [bestQuizScore, setBestQuizScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const prof = await api.getCurrentProfile();
        if (prof) {
          setProfile(prof);

          // Semua request dijalankan paralel sekaligus
          const [
            missionProg,
            lb,
            ub,
            allMaterials,
            allGames,
            gameResults,
            quizResults,
          ] = await Promise.all([
            api.getMissionProgress(),
            api.getLeaderboard(),
            api.getUserBadges(),
            api.getMaterials(),
            api.getGames(),
            api.getGameResults(),
            api.getQuizResults(),
          ]);

          setMissions(missionProg);
          setLeaderboard(lb.slice(0, 4));
          setBadges(ub.slice(0, 3));

          // Cek completion semua materi secara paralel
          const completionResults = await Promise.all(
            allMaterials.map(m => api.isMaterialCompleted(m.id))
          );
          const compMats = completionResults.filter(Boolean).length;
          setMaterialsCount({ completed: compMats, total: allMaterials.length });

          const compGames = new Set(gameResults.map(r => r.game_id)).size;
          setGamesCount({ completed: compGames, total: allGames.length });

          const maxScore = quizResults.length > 0
            ? Math.max(...quizResults.map(r => r.skor))
            : 0;
          setBestQuizScore(maxScore);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate learning progress percentage
  const totalItems = materialsCount.total + gamesCount.total;
  const completedItems = materialsCount.completed + gamesCount.completed;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Render SVG circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Custom illustration matching the health education theme
  const mascotImageUrl = '/hero-education.svg';

  return (
    <div className="space-y-8">
      {/* Hero Banner Section */}
      <section className="relative w-full rounded-[2rem] min-h-[280px] bg-gradient-to-r from-primary via-indigo-600 to-secondary p-8 md:p-12 flex flex-col justify-center text-white shadow-xl shadow-indigo-500/10 overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-headline-lg text-3xl md:text-4xl font-extrabold mb-4 leading-tight"
          >
            Belajar Cerdas,<br />Cegah HIV/AIDS Sejak Remaja
          </motion.h2>
          <p className="text-on-primary-container text-sm md:text-base mb-8 opacity-90 max-w-md">
            Dapatkan pengetahuan akurat secara mandiri, selesaikan misi harian, mainkan game seru, dan kumpulkan poin prestasi!
          </p>
          <button 
            onClick={() => navigate('/materi')}
            className="bg-tertiary-fixed-dim text-on-tertiary-fixed px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/10 w-fit"
          >
            Mulai Belajar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Mascot Illustration overlay */}
        <div className="absolute right-0 bottom-0 w-1/2 md:w-5/12 h-full hidden lg:flex items-end justify-end pointer-events-none rounded-br-[2rem]">
          <img 
            className="w-full h-full object-contain object-right-bottom opacity-100 drop-shadow-xl" 
            style={{ 
              maskImage: 'linear-gradient(to right, transparent, black 45%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 45%)'
            }}
            src={mascotImageUrl}
            alt="Ilustrasi edukasi kesehatan PENDEKAR"
          />
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Progress Belajar Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Progress Belajar</h3>
              <p className="text-[11px] text-on-surface-variant mt-1">Lihat capaianmu hari ini</p>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-1 text-primary text-xs font-bold hover:underline shrink-0"
            >
              Detail Riwayat
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-around gap-4 mb-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  className="text-surface-container" 
                  cx="56" 
                  cy="56" 
                  fill="transparent" 
                  r={radius} 
                  stroke="currentColor" 
                  strokeWidth="10"
                />
                <circle 
                  className="text-primary transition-all duration-1000" 
                  cx="56" 
                  cy="56" 
                  fill="transparent" 
                  r={radius} 
                  stroke="currentColor" 
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-on-surface">{progressPercent}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Materi Selesai</p>
                <p className="font-bold text-sm text-on-surface">
                  {materialsCount.completed} <span className="text-on-surface-variant font-medium">/ {materialsCount.total}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Quiz Terbaik</p>
                <p className="font-bold text-sm text-on-surface">{bestQuizScore}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Game Dimainkan</p>
                <p className="font-bold text-sm text-on-surface">
                  {gamesCount.completed} <span className="text-on-surface-variant font-medium">/ {gamesCount.total}</span>
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/materi')}
            className="bg-primary-fixed/30 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-primary-fixed/40 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-primary-fixed-variant">Ayo selesaikan materimu hari ini!</p>
              <p className="text-[10px] text-on-surface-variant">
                {materialsCount.total - materialsCount.completed > 0 
                  ? `Tersisa ${materialsCount.total - materialsCount.completed} materi lagi` 
                  : 'Hebat, kamu sudah membaca semua materi!'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Akses Cepat Grid */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-outline-variant/30 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6">Akses Cepat</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Materi */}
            <button 
              onClick={() => navigate('/materi')}
              className="flex flex-col items-center p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 group active:scale-95"
            >
              <div className="w-14 h-14 bg-indigo-200/50 rounded-xl flex items-center justify-center text-indigo-700 mb-3 group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7" />
              </div>
              <p className="font-bold text-xs text-indigo-900 mb-1">Materi Edukasi</p>
              <p className="text-[10px] text-indigo-700/60 text-center leading-tight">Pelajari informasi penting HIV/AIDS</p>
            </button>

            {/* Quiz */}
            <button 
              onClick={() => navigate('/quiz')}
              className="flex flex-col items-center p-4 rounded-2xl bg-yellow-50 hover:bg-yellow-100 transition-all border border-yellow-100 group active:scale-95"
            >
              <div className="w-14 h-14 bg-yellow-200/50 rounded-xl flex items-center justify-center text-yellow-700 mb-3 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7" />
              </div>
              <p className="font-bold text-xs text-yellow-900 mb-1">Quiz Harian</p>
              <p className="text-[10px] text-yellow-700/60 text-center leading-tight">Uji batas pemahamanmu</p>
            </button>

            {/* Game */}
            <button 
              onClick={() => navigate('/game')}
              className="flex flex-col items-center p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-100 group active:scale-95"
            >
              <div className="w-14 h-14 bg-emerald-200/50 rounded-xl flex items-center justify-center text-emerald-700 mb-3 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <p className="font-bold text-xs text-emerald-900 mb-1">Game Edukasi</p>
              <p className="text-[10px] text-emerald-700/60 text-center leading-tight">Belajar interaktif sambil bermain</p>
            </button>

            {/* Konsultasi */}
            <button 
              onClick={() => navigate('/konsultasi')}
              className="flex flex-col items-center p-4 rounded-2xl bg-sky-50 hover:bg-sky-100 transition-all border border-sky-100 group active:scale-95"
            >
              <div className="w-14 h-14 bg-sky-200/50 rounded-xl flex items-center justify-center text-sky-700 mb-3 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-7 h-7" />
              </div>
              <p className="font-bold text-xs text-sky-900 mb-1">Konsultasi</p>
              <p className="text-[10px] text-sky-700/60 text-center leading-tight">Tanya secara privat & aman</p>
            </button>

            {/* Layanan */}
            <button 
              onClick={() => navigate('/layanan')}
              className="flex flex-col items-center p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100 group active:scale-95"
            >
              <div className="w-14 h-14 bg-rose-200/50 rounded-xl flex items-center justify-center text-rose-700 mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7" />
              </div>
              <p className="font-bold text-xs text-rose-900 mb-1">Info Layanan</p>
              <p className="text-[10px] text-rose-700/60 text-center leading-tight">Cari VCT dan hotline darurat</p>
            </button>
          </div>
        </motion.div>

        {/* Pencapaian Terbaru */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 hover:shadow-lg transition-shadow flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Badge Unlocked</h3>
          </div>
          <div className="space-y-4">
            {badges.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">
                Belum ada badge yang terbuka. Selesaikan kuis dan game untuk membukanya!
              </p>
            ) : (
              badges.map((ub) => (
                <div key={ub.id} className="flex items-center gap-4 p-3 rounded-2xl bg-surface/50 border border-outline-variant/10">
                  <div className="w-10 h-10 bg-indigo-100 text-primary rounded-full flex items-center justify-center shrink-0 font-bold">
                    🥇
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-on-surface">{ub.badge?.nama}</p>
                    <p className="text-[10px] text-on-surface-variant">{ub.badge?.deskripsi}</p>
                  </div>
                  <p className="text-[9px] text-on-surface-variant/60">
                    {new Date(ub.unlocked_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full mt-6 text-primary text-xs font-bold py-2 border border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
          >
            Lihat Semua Badges
          </button>
        </motion.div>

        {/* Leaderboard Mini */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 hover:shadow-lg transition-shadow flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Leaderboard <span className="text-on-surface-variant font-normal text-xs ml-1">(Poin Teratas)</span></h3>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="text-primary text-xs font-bold hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-3">
            {leaderboard.map((item, index) => {
              const isCurrentUser = item.id === profile.id;
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                    isCurrentUser ? 'bg-primary/5 border border-primary/20' : ''
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${
                    index === 0 ? 'bg-yellow-400 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-amber-600 text-white' : 'text-on-surface-variant'
                  }`}>
                    {medal}
                  </div>
                  <img
                    src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                    alt={item.name}
                    className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
                  />
                  <span className="font-bold text-xs text-on-surface flex-1 truncate">
                    {item.name} {isCurrentUser && <span className="text-[9px] font-normal text-primary">(Kamu)</span>}
                  </span>
                  <span className="font-bold text-primary text-xs shrink-0">
                    {item.points} <span className="text-[9px] font-medium text-on-surface-variant">Pts</span>
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Misi Harian Widget */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 hover:shadow-lg transition-shadow flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-lg font-bold text-on-surface">Misi Harian</h3>
            <div className="flex items-center gap-1 text-[10px] text-error font-bold bg-error-container/20 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Selesai Hari Ini
            </div>
          </div>
          <div className="space-y-4">
            {missions.map((m) => {
              const target = m.misi_harian?.target_count || 1;
              const current = m.current_count;
              const progress = Math.min((current / target) * 100, 100);
              return (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-on-surface block leading-tight">{m.misi_harian?.deskripsi}</span>
                      <span className="text-[10px] text-on-surface-variant font-medium">Progress: {current}/{target}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-tertiary-fixed-dim/15 px-2 py-0.5 rounded-full shrink-0">
                      <Star className="w-3 h-3 text-tertiary-fixed-dim fill-current" />
                      <span className="text-[9px] font-extrabold text-tertiary-container">+{m.misi_harian?.points_reward}</span>
                    </div>
                    {m.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 fill-emerald-50" />
                    ) : (
                      <button 
                        onClick={() => {
                          if (m.misi_harian?.tipe === 'baca_materi') navigate('/materi');
                          if (m.misi_harian?.tipe === 'kerjakan_quiz') navigate('/quiz');
                          if (m.misi_harian?.tipe === 'main_game') navigate('/game');
                        }}
                        className="w-5 h-5 border border-primary/30 hover:bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${m.completed ? 'bg-emerald-500' : 'bg-primary'}`} 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Tahukah Kamu? Section */}
        <div className="col-span-12 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-yellow-400/20 relative z-10">
            <Lightbulb className="w-8 h-8 fill-current" />
          </div>
          <div className="flex-1 relative z-10">
            <h4 className="font-headline-sm text-base font-bold text-on-surface mb-1">Tahukah Kamu?</h4>
            <p className="text-on-surface-variant text-xs md:text-sm max-w-2xl">
              HIV tidak menular melalui pelukan, berjabat tangan, gigitan nyamuk, atau bertukar piring makan. Mari sebar fakta akurat dan lawan stigma negatif terhadap penderita!
            </p>
          </div>
          <button 
            onClick={() => navigate('/materi')}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/20 relative z-10 text-xs"
          >
            Pelajari Sekarang
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
