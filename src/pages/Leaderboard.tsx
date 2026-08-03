import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Profile } from '../services/api';
import { Flame, Trophy } from 'lucide-react';

export default function Leaderboard() {
  const [list, setList] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const board = await api.getLeaderboard();
        setList(board);

        const current = await api.getCurrentProfile();
        setCurrentUser(current);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Split top 3 from the rest
  const topThree = list.slice(0, 3);

  // Podium position mapping (2nd, 1st, 3rd for visual balance)
  const podiumOrder = [
    topThree[1], // 2nd place
    topThree[0], // 1st place
    topThree[2]  // 3rd place
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-primary">Papan Peringkat (Leaderboard)</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Peringkat dihitung dari kombinasi poin, XP, streak, level, dan aktivitas belajar.
        </p>
      </div>

      {/* Podium display */}
      {topThree.length > 0 && (
        <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center">
          <div className="flex items-end justify-center gap-4 md:gap-12 w-full max-w-lg pt-8 pb-4">
            {podiumOrder.map((user, idx) => {
              // Identify place based on index in podiumOrder
              // idx=0 is 2nd place (if 2 users exist), idx=1 is 1st, idx=2 is 3rd
              let place = 1;
              if (podiumOrder.length === 3) {
                place = idx === 0 ? 2 : idx === 1 ? 1 : 3;
              } else if (podiumOrder.length === 2) {
                place = idx === 0 ? 2 : 1;
              }

              const heightClass = place === 1 ? 'h-36 md:h-44 bg-yellow-400/10 border-yellow-400' : place === 2 ? 'h-28 md:h-36 bg-slate-300/10 border-slate-300' : 'h-24 md:h-32 bg-amber-600/10 border-amber-600';
              const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
              
              return (
                <div key={user.id} className="flex flex-col items-center flex-1">
                  {/* Avatar with circle indicator */}
                  <div className="relative mb-2">
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt={user.name}
                      className={`w-14 h-14 md:w-20 md:h-20 rounded-full border-4 object-cover ${
                        place === 1 ? 'border-yellow-400' : place === 2 ? 'border-slate-300' : 'border-amber-600'
                      }`}
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm shadow-md">
                      {medal}
                    </div>
                  </div>

                  <p className="font-bold text-xs md:text-sm text-slate-800 text-center truncate w-24">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Lvl {user.level}</p>
                  {user.reward_bonus && user.reward_bonus > 0 ? (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">Bonus +{user.reward_bonus} Pts</p>
                  ) : null}

                  {/* Visual Podium base */}
                  <div className={`w-full mt-4 rounded-t-2xl border-t border-x flex flex-col justify-end items-center pb-4 ${heightClass}`}>
                    <span className="font-extrabold text-sm md:text-lg text-primary">{user.points}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Poin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="bg-white rounded-[2rem] overflow-hidden border border-outline-variant/30 shadow-sm">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800">Daftar Peringkat</h3>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>Pembaruan Otomatis</span>
          </div>
        </div>

        {/* Mobile: card list — di bawah 768px */}
        <div className="block md:hidden divide-y divide-outline-variant/10">
          {list.map((item, index) => {
            const rank = index + 1;
            const isCurrentUser = item.id === currentUser.id;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            return (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${isCurrentUser ? 'bg-primary/5' : ''}`}>
                <span className="w-8 text-center font-bold text-sm text-slate-600 shrink-0">{medal}</span>
                <img src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                  alt={item.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">
                    {item.name} {isCurrentUser && <span className="text-[10px] font-normal text-primary">(Kamu)</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">Lvl {item.level}</span>
                    <span className="text-[10px] text-orange-500">🔥 {item.streak}h</span>
                  </div>
                </div>
                <span className="font-extrabold text-primary text-sm shrink-0">{item.points.toLocaleString('id-ID')}</span>
              </div>
            );
          })}
        </div>

        {/* Desktop table — 768px ke atas */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-outline-variant/10 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4">Peringkat</th>
                <th className="px-6 py-4">Remaja</th>
                <th className="px-6 py-4">Level</th>
                <th className="px-6 py-4 text-center">Streak</th>
                <th className="px-6 py-4 text-right">Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-xs">
              {list.map((item, index) => {
                const rank = index + 1;
                const isCurrentUser = item.id === currentUser.id;
                return (
                  <tr key={item.id} className={`transition-colors ${isCurrentUser ? 'bg-primary/5 font-bold' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4 font-bold text-slate-600">
                      {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                          alt={item.name} className="w-8 h-8 rounded-full border border-outline-variant/30 object-cover" />
                        <div>
                          <p className="text-slate-800 font-bold">{item.name} {isCurrentUser && <span className="text-[10px] font-normal text-primary ml-1">(Kamu)</span>}</p>
                          <p className="text-[9px] text-slate-500">{item.role === 'admin' ? 'Administrator' : 'Remaja Cerdas'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">Level {item.level}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        <Flame className="w-3.5 h-3.5 fill-current" /><span>{item.streak} Hari</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-primary text-sm">
                      {item.points.toLocaleString('id-ID')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
