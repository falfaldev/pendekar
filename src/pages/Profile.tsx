import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import type { Profile as UserProfile, Badge } from '../services/api';
import { Flame, Star, Award, CheckCircle, Activity, Edit2, Save } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState<number>(16);
  const [editGender, setEditGender] = useState('Laki-laki');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<Set<string>>(new Set());
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({ materialsCompleted: 0, quizzesCompleted: 0, gamesCompleted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const prof = await api.getCurrentProfile();
      if (prof) {
        setProfile(prof);
        setEditName(prof.name);
        setEditAge(prof.age);
        setEditGender(prof.gender || 'Laki-laki');
        setEditAvatarUrl(prof.avatar_url || '');
        setAvatarPreview(prof.avatar_url || '');
        setAvatarFile(null);

        // Fetch badges
        const allBadges = await api.getBadges();
        setBadges(allBadges);

        const unlocked = await api.getUserBadges();
        const unlockedIds = new Set<string>(unlocked.map(ub => ub.badge_id));
        setUnlockedBadgeIds(unlockedIds);

        // Fetch activity logs (works for both Supabase and localStorage)
        try {
          if (isSupabaseConfigured) {
            const { data: acts } = await supabase.from('aktivitas')
              .select('*')
              .eq('user_id', prof.id)
              .order('created_at', { ascending: false })
              .limit(10);
            setActivities(acts || []);
          } else {
            const acts = JSON.parse(localStorage.getItem('pendekar_activities') || '[]');
            setActivities(acts.filter((a: any) => a.user_id === prof.id).reverse().slice(0, 10));
          }
        } catch {
          const acts = JSON.parse(localStorage.getItem('pendekar_activities') || '[]');
          setActivities(acts.filter((a: any) => a.user_id === prof.id).reverse().slice(0, 10));
        }

        // Fetch stats via API (works for both modes)
        const [quizResults, gameResults, allMaterials] = await Promise.all([
          api.getQuizResults(),
          api.getGameResults(),
          api.getMaterials()
        ]);

        let compMats = 0;
        for (const m of allMaterials) {
          const isComp = await api.isMaterialCompleted(m.id);
          if (isComp) compMats++;
        }

        setStats({
          materialsCompleted: compMats,
          quizzesCompleted: quizResults.length,
          gamesCompleted: new Set(gameResults.map((r: any) => r.game_id)).size
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarFileChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setEditAvatarUrl('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setMessage('');
    try {
      let finalAvatarUrl = editAvatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await api.uploadMaterialAsset(avatarFile, 'avatars');
      }
      const updated = await api.updateProfile(editName, editAge, editGender, finalAvatarUrl);
      setProfile(updated);
      setIsEditing(false);
      setAvatarFile(null);
      setMessage('Profil berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui profil.');
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const xpInCurrentLevel = profile.xp % 1000;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header & Edit Card */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-outline-variant/30 relative">
        {message && (
          <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl animate-fade-in">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
          {/* Avatar and basic Info */}
          <div className="relative shrink-0">
            <img
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
              alt={profile.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary/20 object-cover shadow-md"
            />
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-extrabold shadow-md">
              {profile.level}
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full">
            {!isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-headline-sm text-xl md:text-2xl font-extrabold text-slate-800 leading-none">
                      {profile.name}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-1.5 font-medium">
                      Remaja • {profile.age} Tahun • {profile.gender}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-1.5 bg-slate-50 border border-outline-variant/30 hover:border-primary text-primary font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm w-fit"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profil
                  </button>
                </div>

                {/* XP Progress Slider */}
                <div className="space-y-1.5 pt-4">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Level {profile.level}</span>
                    <span>{xpInCurrentLevel} / 1000 XP</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Score indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    <Star className="w-4 h-4 text-tertiary-fixed-dim fill-current mx-auto mb-1" />
                    <span className="text-sm font-extrabold text-primary block leading-none">{profile.points}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Poin</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    <Flame className="w-4 h-4 text-orange-500 fill-current mx-auto mb-1" />
                    <span className="text-sm font-extrabold text-primary block leading-none">{profile.streak}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Streak</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    <CheckCircle className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                    <span className="text-sm font-extrabold text-primary block leading-none">{stats.materialsCompleted}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Materi</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    <Award className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                    <span className="text-sm font-extrabold text-primary block leading-none">{stats.quizzesCompleted}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Kuis</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Nama Panggilan
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Foto Profil
                    </label>
                    {/* Preview */}
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={avatarPreview || editAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                        alt="preview"
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      />
                      <span className="text-[10px] text-slate-400">
                        {avatarFile ? avatarFile.name : 'Pilih file atau tempel URL'}
                      </span>
                    </div>
                    {/* File input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarFileChange(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-3 py-2 text-xs file:text-xs file:font-semibold file:border-0 file:bg-primary file:text-white file:px-3 file:py-1.5 file:rounded-lg focus:outline-none"
                    />
                    {/* URL fallback */}
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => {
                        setEditAvatarUrl(e.target.value);
                        setAvatarPreview(e.target.value);
                        if (e.target.value) setAvatarFile(null);
                      }}
                      placeholder="Atau tempel URL foto..."
                      className="mt-2 w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Umur (Tahun)
                    </label>
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(parseInt(e.target.value) || 16)}
                      className="w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Jenis Kelamin
                    </label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full bg-slate-50 border border-outline-variant/30 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 border border-outline-variant/30 text-on-surface hover:bg-slate-50 font-bold text-xs rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary/10 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Simpan Profil
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Badge Gallery */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-outline-variant/30 space-y-6">
        <div>
          <h3 className="font-bold text-base text-slate-800">Galeri Badge Prestasi</h3>
          <p className="text-[10px] text-slate-500">Selesaikan lebih banyak materi pelajaran, kuis nilai 100, dan game interaktif untuk melengkapi lencanamu.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id);
            return (
              <div 
                key={badge.id}
                className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-between space-y-3 transition-all ${
                  isUnlocked 
                    ? 'border-indigo-100 bg-indigo-50/20 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 opacity-55'
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm ${
                  isUnlocked ? 'bg-primary text-white scale-105' : 'bg-slate-200 text-slate-400'
                }`}>
                  {badge.icon === 'stars' ? '🥇' : badge.icon === 'verified_user' ? '🛡️' : badge.icon === 'workspace_premium' ? '🏆' : '🎮'}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{badge.nama}</h4>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">{badge.deskripsi}</p>
                </div>
                <span className={`inline-block font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isUnlocked ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  {isUnlocked ? 'Terbuka' : 'Terkunci'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Logs timeline */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-outline-variant/30 space-y-6">
        <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Riwayat Aktivitas Belajar
        </h3>

        <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6 text-xs text-on-surface-variant font-medium">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 font-normal">Belum ada riwayat aktivitas yang tercatat.</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-slate-800">{a.tipe_aktivitas}</span>
                  <span className="text-[9px] text-slate-400 font-bold">
                    {new Date(a.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-slate-500 mt-1 leading-relaxed">{a.detail}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
