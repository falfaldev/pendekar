import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Game } from '../services/api';
import { Gamepad2, Play, Award } from 'lucide-react';

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());
  const [gameProgress, setGameProgress] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadGames() {
      setIsLoading(true);
      try {
        const list = await api.getGames();
        setGames(list);

        const results = await api.getGameResults();
        const finishedIds = new Set<string>(results.map(r => r.game_id));
        setCompletedGames(finishedIds);

        const progressMap: Record<string, any> = {};
        for (const game of list) {
          progressMap[game.id] = await api.getGameProgress(game.id);
        }
        setGameProgress(progressMap);
      } catch (err) {
        console.error('Error loading games list:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGames();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Helper icons for games
  const getGameStyles = (tipe: string) => {
    switch (tipe) {
      case 'benar_salah':
        return { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', iconBg: 'bg-indigo-200/50' };
      case 'memory':
        return { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', iconBg: 'bg-purple-200/50' };
      case 'drag_drop':
        return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-200/50' };
      case 'tebak_gambar':
        return { bg: 'bg-yellow-50 border-yellow-100', text: 'text-yellow-700', iconBg: 'bg-yellow-200/50' };
      case 'puzzle':
        return { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-700', iconBg: 'bg-rose-200/50' };
      default:
        return { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-700', iconBg: 'bg-slate-200/50' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-primary">Game Edukasi</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Setiap permainan punya tantangan berbeda, dan nanti bisa dikembangkan menjadi mode bertingkat seperti game pada umumnya.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((g) => {
          const styles = getGameStyles(g.tipe);
          const isCompleted = completedGames.has(g.id);
          const progress = gameProgress[g.id] || { current_level: 1, completed_levels: 0, max_level: 3, completed: false };
          const progressPercent = (progress.completed_levels / progress.max_level) * 100;
          const buttonLabel = progress.completed ? 'Main Lagi' : `Lanjut Level ${progress.current_level}`;
          
          return (
            <div 
              key={g.id}
              className={`border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow bg-white ${
                isCompleted ? 'border-emerald-500/20' : 'border-outline-variant/30'
              }`}
            >
              {/* Card Top */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.text}`}>
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-800 leading-tight">
                      {g.nama}
                    </h3>
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                      Tipe: {g.tipe.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {g.deskripsi || 'Nikmati keseruan bermain game interaktif edukatif ini.'}
                </p>
              </div>

              {/* Card Footer & Rewards */}
              <div className="mt-8 pt-6 border-t border-outline-variant/10 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-on-surface-variant">
                  <span className="bg-primary/5 text-primary px-2 py-0.5 rounded-full">
                    +{g.xp_reward} XP
                  </span>
                  <span className="bg-tertiary-fixed-dim/10 text-tertiary-container px-2 py-0.5 rounded-full">
                    +{g.points_reward} Poin
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-on-surface-variant mb-1">
                    <span>{progress.completed ? 'Semua level selesai' : `Level ${progress.current_level}/${progress.max_level}`}</span>
                    <span>{progress.completed_levels}/{progress.max_level}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                  </div>
                </div>

                {isCompleted && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <Award className="w-3.5 h-3.5" />
                    <span>Sudah pernah dimainkan</span>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/game/${g.tipe}/${g.id}`)}
                  className="w-full bg-primary hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-primary/10 active:scale-95 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {buttonLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
