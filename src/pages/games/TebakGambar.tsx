import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Game } from '../../services/api';
import { ShieldCheck, ArrowLeft, ArrowRight, HelpCircle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TebakGambar() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadGame() {
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
        console.error('Error loading tebak gambar game:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGame();
  }, [id]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
  };

  const handleConfirm = () => {
    if (!selectedOption || isAnswered) return;
    
    const correct = selectedOption === questions[currentIndex].answer;
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalScore = Math.round((correctCount / questions.length) * 100);
      try {
        const res = await api.submitGameResult(game!.id, finalScore, currentLevel);
        setRewardData(res);
        setCurrentLevel(res.nextLevel || currentLevel);
        setIsFinished(true);
      } catch (err) {
        console.error('Error submitting game score:', err);
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
    const finalScore = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[2rem] p-8 text-center border border-outline-variant/20 shadow-xl space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <ShieldCheck className="w-12 h-12" />
          </div>

          <div>
            <h2 className="font-headline-sm text-xl font-extrabold text-on-surface">Tebak Gambar Selesai!</h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Hasil analisis kuis visual kamu adalah:
            </p>
          </div>

          <div className="py-4">
            <div className="text-5xl font-extrabold text-primary">{finalScore}</div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-2">Skor Visual</p>
            <p className="text-xs text-on-surface-variant mt-1">Benar {correctCount} dari {questions.length} gambar</p>
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
                setSelectedOption(null);
                setIsAnswered(false);
                setCorrectCount(0);
                setIsFinished(false);
                setRewardData(null);
              }}
              className="py-3 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
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
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/game')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar Permainan
        </button>
        <span className="text-xs font-bold text-primary">Tebak Gambar (Level {currentLevel} • Soal {currentIndex + 1}/{questions.length})</span>
      </div>

      {/* Progress line */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Game visual panel */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
        >
          {/* Left Side: Image display */}
          <div className="relative group rounded-2xl overflow-hidden border border-outline-variant/20 h-64 bg-slate-100 shadow-inner cursor-pointer">
            <motion.img
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              src={currentQ.imageUrl}
              alt="Tebakan"
              className="w-full h-full object-cover"
              onClick={() => setIsZoomed(true)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
              <span className="text-white font-bold text-xs flex items-center gap-2">
                🔍 Klik untuk perbesar
              </span>
            </div>
          </div>
  
          {/* Right Side: Question and Options */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-sm text-slate-800 leading-snug">
                {currentQ.question}
              </h3>
            </div>
  
            <div className="space-y-2">
              {currentQ.options.map((opt: string) => {
                const isSelected = selectedOption === opt;
                const isCorrectOpt = opt === currentQ.answer;
  
                let btnClass = 'border-outline-variant/30 bg-white hover:bg-slate-50 text-slate-800';
                let iconMarkup = null;
  
                if (isAnswered) {
                  if (isCorrectOpt) {
                    btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                    iconMarkup = <Check className="w-4 h-4 text-emerald-600 animate-bounce" />;
                  } else if (isSelected) {
                    btnClass = 'border-red-500 bg-red-50 text-red-800';
                    iconMarkup = <X className="w-4 h-4 text-red-600 animate-pulse" />;
                  } else {
                    btnClass = 'border-outline-variant/10 bg-white text-slate-300 opacity-50';
                  }
                } else if (isSelected) {
                  btnClass = 'border-primary bg-primary/5 text-primary scale-[0.99] shadow-inner';
                }
  
                return (
                  <motion.button
                    whileHover={!isAnswered && !isSelected ? { scale: 1.02 } : {}}
                    whileTap={!isAnswered ? { scale: 0.98 } : {}}
                    key={opt}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full flex items-center justify-between p-3 border rounded-xl font-bold text-xs text-left transition-all ${btnClass}`}
                  >
                    <span>{opt}</span>
                    {iconMarkup}
                  </motion.button>
                );
              })}
            </div>
  
            {/* Confirm or Next Button */}
            <div className="flex justify-end pt-2">
              <AnimatePresence mode="wait">
                {!isAnswered ? (
                  <motion.button
                    key="confirm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleConfirm}
                    disabled={!selectedOption}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      selectedOption 
                        ? 'bg-primary hover:bg-indigo-700 text-white shadow-md shadow-primary/20' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Pilih Jawaban
                  </motion.button>
                ) : (
                  <motion.button
                    key="next"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={handleNext}
                    className="bg-primary hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors shadow-md shadow-primary/20"
                  >
                    {currentIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Selesai'}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={currentQ.imageUrl} 
              alt="Zoomed"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
