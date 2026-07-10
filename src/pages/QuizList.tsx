import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Quiz } from '../services/api';
import { Award, Play, CheckCircle } from 'lucide-react';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [scoreHistory, setScoreHistory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadQuizzes() {
      setIsLoading(true);
      try {
        const list = await api.getQuizzes();
        setQuizzes(list);

        const results = await api.getQuizResults();
        // map quiz_id to best score
        const scoreMap: Record<string, number> = {};
        results.forEach(r => {
          if (!scoreMap[r.quiz_id] || r.skor > scoreMap[r.quiz_id]) {
            scoreMap[r.quiz_id] = r.skor;
          }
        });
        setScoreHistory(scoreMap);
      } catch (err) {
        console.error('Error loading quizzes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-primary">Kuis Pelajaran</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Uji pemahamanmu setelah membaca materi dan peroleh poin bonus untuk naik peringkat di papan peringkat!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((q) => {
          const bestScore = scoreHistory[q.id];
          const hasDikerjakan = bestScore !== undefined;
          
          return (
            <div 
              key={q.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Top info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-on-surface leading-tight group-hover:text-primary transition-colors">
                      {q.judul}
                    </h3>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Quiz Pelajaran</p>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {q.deskripsi || 'Selesaikan kuis evaluasi singkat ini untuk menguji pengetahuan barumu.'}
                </p>
              </div>

              {/* Stats and play button */}
              <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                    <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-full">
                      +{q.xp_reward} XP
                    </span>
                    <span className="bg-tertiary-fixed-dim/10 text-tertiary-container px-2.5 py-1 rounded-full">
                      +{q.points_reward} Poin
                    </span>
                  </div>
                  {hasDikerjakan && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5 fill-emerald-50" />
                      <span>Terbaik: {bestScore}%</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/quiz/${q.id}`)}
                  className="bg-primary hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/10 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {hasDikerjakan ? 'Ulangi Kuis' : 'Mulai Kuis'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
