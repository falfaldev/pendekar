import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Game } from '../../services/api';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BenarSalah() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadGameData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const games = await api.getGames();
        const found = games.find(g => g.id === id);
        if (found) {
          setGame(found);
          const progress = await api.getGameProgress(found.id);
          setCurrentLevel(progress.current_level);
          const data = await api.getGameQuestions(found.id, progress.current_level);
          setQuestions(data || []);
        }
      } catch (err) {
        console.error('Error loading game content:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGameData();
  }, [id]);

  const handleAnswer = (ans: boolean) => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);

    const q = questions[currentIndex];
    const isCorrect = ans === q.answer;
    if (isCorrect) {
      setScore(prev => prev + 20); // 5 questions, 20 points each = 100 max
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      try {
        const res = await api.submitGameResult(game!.id, score, currentLevel);
        setRewardData(res);
        setCurrentLevel(res.nextLevel || currentLevel);
        setIsFinished(true);
      } catch (err) {
        console.error('Error saving game results:', err);
        setIsFinished(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Game Content Not Found</h2>
        <button onClick={() => navigate('/game')} className="mt-4 bg-primary text-white px-4 py-2 rounded-xl">
          Kembali ke Game Edukasi
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[2rem] p-8 text-center border border-outline-variant/20 shadow-xl space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center relative">
            <ShieldCheck className="w-12 h-12" />
          </div>

          <div>
            <h2 className="font-headline-sm text-xl font-extrabold text-on-surface">Permainan Selesai!</h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Kamu berhasil menyelesaikan game **Benar atau Salah**. Nilaimu adalah:
            </p>
          </div>

          <div className="py-4">
            <div className="text-5xl font-extrabold text-primary">{score}</div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-2">Skor Game</p>
          </div>

          {rewardData && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-center">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">XP Diperoleh</p>
                <p className="text-primary text-lg font-extrabold mt-1">+{rewardData.xpEarned} XP</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Poin Diperoleh</p>
                <p className="text-tertiary-container text-lg font-extrabold mt-1">+{rewardData.pointsEarned} Pts</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setIsAnswered(false);
                setScore(0);
                setIsFinished(false);
                setRewardData(null);
              }}
              className="py-3 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors animate-fade-in"
            >
              Main Lagi
            </button>
            <button
              onClick={() => navigate('/game')}
              className="py-3 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-primary/20"
            >
              Kembali
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Game navigation and header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/game')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar Permainan
        </button>
        <span className="text-xs font-bold text-primary">Benar atau Salah (Level {currentLevel} • Soal {currentIndex + 1}/{questions.length})</span>
      </div>

      {/* Progress line */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Game Card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-outline-variant/30 space-y-8 text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
            <HelpCircle className="w-5 h-5" />
            <span>Pertanyaan Mitos vs Fakta</span>
          </div>
  
          <div className="min-h-[100px] flex items-center justify-center px-4">
            <h2 className="font-headline-sm text-lg md:text-xl font-extrabold text-slate-800 leading-snug">
              "{currentQ.statement}"
            </h2>
          </div>
  
          {/* Binary Choices */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <motion.button
              whileHover={!isAnswered ? { scale: 1.05 } : {}}
              whileTap={!isAnswered ? { scale: 0.95 } : {}}
              disabled={isAnswered}
              onClick={() => handleAnswer(true)}
              className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 border transition-all ${
                isAnswered 
                  ? currentQ.answer === true
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : selectedAnswer === true
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : 'bg-slate-50 border-outline-variant/10 text-slate-300 opacity-50'
                  : 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100 text-indigo-700 active:scale-95'
              }`}
            >
              <CheckCircle2 className={`w-8 h-8 ${isAnswered && currentQ.answer === true ? 'animate-bounce' : ''}`} />
              <span>BENAR (FAKTA)</span>
            </motion.button>
  
            <motion.button
              whileHover={!isAnswered ? { scale: 1.05 } : {}}
              whileTap={!isAnswered ? { scale: 0.95 } : {}}
              disabled={isAnswered}
              onClick={() => handleAnswer(false)}
              className={`py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 border transition-all ${
                isAnswered 
                  ? currentQ.answer === false
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : selectedAnswer === false
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : 'bg-slate-50 border-outline-variant/10 text-slate-300 opacity-50'
                  : 'bg-rose-50/50 hover:bg-rose-50 border-rose-100 text-rose-700 active:scale-95'
              }`}
            >
              <XCircle className={`w-8 h-8 ${isAnswered && currentQ.answer === false ? 'animate-bounce' : ''}`} />
              <span>SALAH (MITOS)</span>
            </motion.button>
          </div>
  
          {/* Explanation Card */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: 10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0 }}
                className={`p-5 rounded-2xl border text-left text-xs md:text-sm leading-relaxed ${
                  selectedAnswer === currentQ.answer 
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : 'bg-red-50/50 border-red-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold uppercase tracking-wider text-xs px-2 py-0.5 rounded ${
                    selectedAnswer === currentQ.answer ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {selectedAnswer === currentQ.answer ? 'Tepat Sekali!' : 'Kurang Tepat!'}
                  </span>
                  <span className="font-bold text-slate-700">Fakta Kunci:</span>
                </div>
                <p className="text-on-surface-variant font-medium">{currentQ.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
  
          {/* Navigation Action */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end mt-4"
              >
                <button
                  onClick={handleNext}
                  className="bg-primary hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/20 active:scale-95"
                >
                  {currentIndex < questions.length - 1 ? 'Pertanyaan Berikutnya' : 'Selesaikan Permainan'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
