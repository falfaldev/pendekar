import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, BookOpen, Award, MessageSquare, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const adminStats = await api.getAdminStats();
        setStats(adminStats);

        // Fetch recent activity logs via API (works for Supabase and localStorage)
        const logs = await api.getRecentActivityLogs(5);
        setRecentLogs(logs);
      } catch (err) {
        console.error('Error loading admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Jumlah Pengguna', value: stats.userCount, icon: Users, color: 'text-blue-600 bg-blue-50', link: '/admin/users' },
    { label: 'Total Materi', value: stats.materialCount, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50', link: '/admin/materi' },
    { label: 'Jumlah Kuis', value: stats.quizCount, icon: Award, color: 'text-yellow-600 bg-yellow-50', link: '/admin/quiz' },
    { label: 'Konsultasi Masuk', value: stats.pendingConsultations, icon: MessageSquare, color: 'text-red-600 bg-red-50', link: '/admin/konsultasi' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-slate-800">Ringkasan Sistem PENDEKAR</h1>
        <p className="text-slate-500 text-sm mt-1">Status dan pemantauan aktivitas pembelajaran real-time.</p>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="space-y-1">
                <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-wider block">{card.label}</span>
                <span className="text-2xl font-extrabold text-slate-800">{card.value}</span>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bento content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: System Performance stats */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-slate-800">Indikator Kinerja Belajar</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Nilai Rerata Kuis</span>
              <span className="text-3xl font-extrabold text-red-600 block mt-1">{stats.averageQuizScore}%</span>
              <span className="text-[10px] text-slate-500 font-normal">Dari seluruh percobaan</span>
            </div>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-center">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Materi Terpopuler</span>
              <span className="text-xs font-bold text-slate-800 block mt-2 h-10 truncate leading-tight">
                {stats.popularMaterial}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Paling sering dibaca</span>
            </div>
          </div>
        </div>

        {/* Right Side: Activity log */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" /> Log Aktivitas Terkini
          </h3>
          
          <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 text-xs text-slate-600 font-medium">
            {recentLogs.length === 0 ? (
              <p className="text-slate-400 py-4 font-normal">Belum ada aktivitas terekam.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-sm" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-slate-800">{log.userName} • {log.tipe_aktivitas}</span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1 leading-normal">{log.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
