import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Quiz, QuizQuestion } from '../services/api';
import { ArrowRight, HelpCircle, Check, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuizActive() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewardData, setRewardData] = useState<{ xpEarned: number; pointsEarned: number; leveledUp: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadQuizData() {
      if (!id) return;
      setIsLoading(true);
      try {
        const quizzes = await api.getQuizzes();
        const found = quizzes.find(q => q.id === id);
        if (found) {
          setQuiz(found);
          const qns = await api.getQuizQuestions(found.id);
          setQuestions(qns);
        }
      } catch (err) {
        console.error('Error loading quiz active:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizData();
  }, [id]);

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswered) return;

    const q = questions[currentIndex];
    const correct = selectedOption === q.jawaban_benar;
    if (correct) {
      setCorrectAnswersCount(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Include the last answer in score: check if current answer is correct
      const q = questions[currentIndex];
      const lastCorrect = selectedOption === q.jawaban_benar ? 1 : 0;
      const totalCorrect = correctAnswersCount + lastCorrect;
      const score = Math.round((totalCorrect / questions.length) * 100);
      try {
        const res = await api.submitQuizResult(quiz!.id, score);
        setRewardData(res);
        setIsFinished(true);
      } catch (err) {
        console.error('Error submitting quiz score:', err);
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

  if (!quiz || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Quiz Tidak Mempunyai Soal</h2>
        <button 
          onClick={() => navigate('/quiz')}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-xl"
        >
          Kembali ke Daftar Kuis
        </button>
      </div>
    );
  }

  if (isFinished) {
    const finalScore = Math.round((correctAnswersCount / questions.length) * 100);
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[2rem] p-8 text-center border border-outline-variant/20 shadow-xl space-y-6"
        >
          <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full mx-auto flex items-center justify-center relative">
            <Sparkles className="w-10 h-10 text-yellow-500 fill-current" />
          </div>

          <div>
            <h2 className="font-headline-sm text-xl font-extrabold text-on-surface">Evaluasi Kuis Selesai!</h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Kamu telah menjawab semua soal. Berikut adalah pencapaian nilaimu:
            </p>
          </div>

          {/* Large score display */}
          <div className="py-4">
            <div className="text-5xl font-extrabold text-primary">{finalScore}</div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-2">
              Skor Pengetahuan
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Benar {correctAnswersCount} dari {questions.length} soal
            </p>
          </div>

          {/* Reward cards */}
          {rewardData && (
            <div className="space-y-3">
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

              {rewardData.xpEarned === 0 && rewardData.pointsEarned === 0 && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                  Kamu sudah pernah menyelesaikan kuis ini. Fitur ulang tetap ada untuk latihan, tetapi reward tidak akan ditambah lagi.
                </div>
              )}
            </div>
          )}

          {rewardData?.leveledUp && (
            <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-800 rounded-xl p-3 text-xs font-bold animate-bounce">
              Naik ke Level Selanjutnya! 🎉
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSelectedOption(null);
                setIsAnswered(false);
                setCorrectAnswersCount(0);
                setIsFinished(false);
                setRewardData(null);
              }}
              className="py-3 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Ulangi Kuis
            </button>
            <button
              onClick={() => navigate('/quiz')}
              className="py-3 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-primary/20"
            >
              Daftar Kuis
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Quiz Progress header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-on-surface-variant">Kuis Aktif</span>
          <h2 className="font-bold text-sm text-primary leading-tight">{quiz.judul}</h2>
        </div>
        <div className="text-right shrink-0">
          <span className="font-bold text-sm text-primary">{currentIndex + 1}</span>
          <span className="text-on-surface-variant font-medium text-xs"> / {totalQuestions} Soal</span>
        </div>
      </div>

      {/* Progress line */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-outline-variant/20 space-y-6">
        <div className="flex gap-3">
          <HelpCircle className="w-6 h-6 text-primary shrink-0" />
          <h3 className="font-bold text-base md:text-lg text-on-surface leading-snug">
            {currentQuestion.pertanyaan}
          </h3>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((opt) => {
            const label = opt === 'A' ? currentQuestion.opsi_a : 
                          opt === 'B' ? currentQuestion.opsi_b : 
                          opt === 'C' ? currentQuestion.opsi_c : currentQuestion.opsi_d;
                          
            const isSelected = selectedOption === opt;
            const isCorrectOption = opt === currentQuestion.jawaban_benar;
            
            let btnClass = 'border-outline-variant/30 bg-white hover:bg-slate-50 text-on-surface';
            let iconMarkup = null;

            if (isAnswered) {
              if (isCorrectOption) {
                btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                iconMarkup = <Check className="w-4 h-4 text-emerald-600" />;
              } else if (isSelected) {
                btnClass = 'border-red-500 bg-red-50 text-red-800';
                iconMarkup = <X className="w-4 h-4 text-red-600" />;
              } else {
                btnClass = 'border-outline-variant/10 bg-white text-on-surface-variant/40';
              }
            } else if (isSelected) {
              btnClass = 'border-primary bg-primary/5 text-primary scale-[0.99]';
            }

            return (
              <button
                key={opt}
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt)}
                className={`w-full flex items-center justify-between p-4 border rounded-2xl font-bold text-xs md:text-sm text-left transition-all ${btnClass}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 font-extrabold ${
                    isSelected ? 'bg-primary text-white border-primary' : 'border-outline-variant bg-slate-50'
                  }`}>
                    {opt}
                  </span>
                  <span>{label}</span>
                </div>
                {iconMarkup}
              </button>
            );
          })}
        </div>

        {/* Answer Explanatory text */}
        {isAnswered && (
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-xs text-on-surface-variant leading-relaxed">
            <span className="font-bold text-primary block mb-1">Informasi Kesehatan:</span>
            {selectedOption === currentQuestion.jawaban_benar 
              ? 'Jawaban kamu benar! Teruskan menjaga pemahaman yang luar biasa ini.' 
              : `Jawaban kamu kurang tepat. Jawaban yang benar adalah pilihan ${currentQuestion.jawaban_benar}.`
            }
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          {!isAnswered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className={`px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                selectedOption 
                  ? 'bg-primary hover:bg-indigo-700 text-white shadow-lg shadow-primary/20' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Kirim Jawaban
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-primary hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-primary/20"
            >
              {currentIndex < questions.length - 1 ? 'Soal Berikutnya' : 'Selesaikan Kuis'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
