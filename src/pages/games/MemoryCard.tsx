import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Game } from '../../services/api';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Card {
  id: string;
  text: string;
  matchId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryCard() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          if (data && data.pairs) {
            setupBoard(data.pairs);
          }
        }
      } catch (err) {
        console.error('Error loading memory game:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGame();
  }, [id]);

  const setupBoard = (pairs: Array<{ text: string; match: string }>) => {
    const list: Card[] = [];
    pairs.forEach((p, idx) => {
      const matchId = `pair-${idx}`;
      list.push({
        id: `card-${idx}-a`,
        text: p.text,
        matchId,
        isFlipped: false,
        isMatched: false
      });
      list.push({
        id: `card-${idx}-b`,
        text: p.match,
        matchId,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle the list
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setMoves(0);
    setIsFinished(false);
    setRewardData(null);
  };

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || selectedCards.length === 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIdx, secondIdx] = newSelected;
      
      // Check if matchId matches
      if (cards[firstIdx].matchId === cards[secondIdx].matchId) {
        // Matched!
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setSelectedCards([]);

          // Check if all matched
          if (matchedCards.every(c => c.isMatched)) {
            finishGame();
          }
        }, 600);
      } else {
        // No match: Flip back
        setTimeout(() => {
          const flippedCards = [...cards];
          flippedCards[firstIdx].isFlipped = false;
          flippedCards[secondIdx].isFlipped = false;
          setCards(flippedCards);
          setSelectedCards([]);
        }, 1200);
      }
    }
  };

  const finishGame = async () => {
    // Score calculation: 100 base, minus deductions for extra moves
    // Perfect is pairs.length moves (since each pair takes 1 correct attempt)
    const pairsCount = cards.length / 2;
    const extraMoves = Math.max(0, moves - pairsCount);
    const score = Math.max(50, 100 - extraMoves * 5); // min 50

    try {
      const res = await api.submitGameResult(game!.id, score, currentLevel);
      setRewardData(res);
      setCurrentLevel(res.nextLevel || currentLevel);
      setIsFinished(true);
    } catch (err) {
      console.error('Error submitting memory game results:', err);
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game || cards.length === 0) {
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
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <ShieldCheck className="w-12 h-12" />
          </div>

          <div>
            <h2 className="font-headline-sm text-xl font-extrabold text-on-surface">Pasangan Sempurna!</h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Kamu berhasil mencocokkan seluruh kartu dalam **{moves} gerakan**.
            </p>
          </div>

          <div className="py-4">
            <div className="text-5xl font-extrabold text-primary">
              {Math.max(50, 100 - Math.max(0, moves - (cards.length / 2)) * 5)}
            </div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-2">Skor Kinerja</p>
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
              onClick={async () => {
                // Reload fresh game data for current level
                if (game) {
                  const data = await api.getGameQuestions(game.id, currentLevel);
                  if (data && data.pairs) {
                    setupBoard(data.pairs);
                  }
                }
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Game navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/game')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar Permainan
        </button>
        <div className="flex items-center gap-4 text-xs font-bold text-primary">
          <span>Gerakan: {moves}</span>
          <button 
            onClick={async () => {
              if (game) {
                const data = await api.getGameQuestions(game.id, currentLevel);
                if (data && data.pairs) setupBoard(data.pairs);
              }
            }} 
            className="flex items-center gap-1 hover:text-indigo-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restart
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="font-bold text-lg text-slate-800">Cari Pasangan Kartu Edukasi</h2>
        <p className="text-xs text-on-surface-variant mt-1">Buka dua kartu dan cocokkan istilah kesehatan reproduksi dengan artinya. Level saat ini: {currentLevel}.</p>
      </div>

      {/* Memory Board Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 max-w-lg mx-auto">
        {cards.map((card, index) => {
          const isFlippedOrMatched = card.isFlipped || card.isMatched;
          return (
            <motion.div
              whileHover={!isFlippedOrMatched ? { scale: 1.05 } : {}}
              whileTap={!isFlippedOrMatched ? { scale: 0.95 } : {}}
              key={card.id}
              onClick={() => handleCardClick(index)}
              className="h-28 md:h-32 relative cursor-pointer select-none"
              style={{ perspective: 1000 }}
            >
              <motion.div 
                animate={{ rotateY: isFlippedOrMatched ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Back side of Card (Unflipped) */}
                <div 
                  className="absolute inset-0 w-full h-full rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary to-indigo-700 flex flex-col items-center justify-center shadow-md backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white mb-2 shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] tracking-widest font-extrabold uppercase text-white/90">PENDEKAR</span>
                </div>
                
                {/* Front side of Card (Flipped) */}
                <div 
                  className={`absolute inset-0 w-full h-full rounded-2xl border-2 flex items-center justify-center font-bold text-xs p-3 shadow-md backface-hidden ${
                    card.isMatched ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-indigo-50 border-primary text-primary'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="max-w-full truncate text-center break-words text-xs md:text-sm leading-tight">
                    {card.text}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
