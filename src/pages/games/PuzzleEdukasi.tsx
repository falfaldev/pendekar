import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Game } from '../../services/api';
import { ShieldCheck, ArrowLeft, RefreshCw, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface PuzzlePiece {
  correctIndex: number;
  currentIndex: number;
}

export default function PuzzleEdukasi() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [factText, setFactText] = useState('');
  
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
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
          if (data) {
            setImageUrl(data.imageUrl || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400');
            setFactText(data.fact || 'HIV dapat dicegah dan dikendalikan.');
            setupPuzzle();
          }
        }
      } catch (err) {
        console.error('Error loading puzzle game:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGame();
  }, [id]);

  const setupPuzzle = () => {
    const list: PuzzlePiece[] = [];
    for (let i = 0; i < 9; i++) {
      list.push({ correctIndex: i, currentIndex: i });
    }

    // Shuffle by swapping random positions
    // Make sure it is not in the correct order initially
    let isCorrect = true;
    while (isCorrect) {
      list.sort(() => Math.random() - 0.5);
      isCorrect = list.every((p, idx) => p.correctIndex === idx);
    }

    // Update currentIndex to match current array positions
    const initialized = list.map((p, idx) => ({ ...p, currentIndex: idx }));
    setPieces(initialized);
    setSelectedPieceIndex(null);
    setMoves(0);
    setIsFinished(false);
    setRewardData(null);
  };

  const handleTileClick = (index: number) => {
    if (isFinished) return;

    if (selectedPieceIndex === null) {
      setSelectedPieceIndex(index);
    } else {
      // Swap selectedPieceIndex and index
      const newPieces = [...pieces];
      const temp = newPieces[selectedPieceIndex];
      newPieces[selectedPieceIndex] = newPieces[index];
      newPieces[index] = temp;

      setPieces(newPieces);
      setMoves(prev => prev + 1);
      setSelectedPieceIndex(null);

      // Verify completion
      const allCorrect = newPieces.every((p, idx) => p.correctIndex === idx);
      if (allCorrect) {
        finishPuzzle();
      }
    }
  };

  const finishPuzzle = async () => {
    // Score based on moves
    // Perfect is around 8-15 moves
    const extraMoves = Math.max(0, moves - 10);
    const score = Math.max(60, 100 - extraMoves * 3); // min 60

    try {
      const res = await api.submitGameResult(game!.id, score, currentLevel);
      setRewardData(res);
      setCurrentLevel(res.nextLevel || currentLevel);
      setIsFinished(true);
    } catch (err) {
      console.error('Error submitting puzzle game results:', err);
      setIsFinished(true);
    }
  };

  // Helper to calculate background coordinates for 3x3 slicing
  const getBackgroundStyles = (correctIndex: number) => {
    const row = Math.floor(correctIndex / 3);
    const col = correctIndex % 3;
    // For 3x3 background: columns are 0%, 50%, 100%
    const posX = (col * 50) + '%';
    const posY = (row * 50) + '%';

    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: '300% 300%',
      backgroundPosition: `${posX} ${posY}`
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game || pieces.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Game Content Not Found</h2>
        <button onClick={() => navigate('/game')} className="mt-4 bg-primary text-white px-4 py-2 rounded-xl">
          Kembali ke Game Edukasi
        </button>
      </div>
    );
  }

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
        <div className="flex items-center gap-4 text-xs font-bold text-primary">
          <span>Langkah: {moves}</span>
          <button 
            onClick={setupPuzzle} 
            className="flex items-center gap-1 hover:text-indigo-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restart
          </button>
        </div>
      </div>

      <div className="text-center">
        <h2 className="font-bold text-lg text-slate-800">Puzzle Edukasi Kesehatan</h2>
        <p className="text-xs text-on-surface-variant mt-1">Klik dua kepingan gambar secara bergantian untuk menukar posisinya hingga tersusun rapi. Level saat ini: {currentLevel}.</p>
      </div>

      {/* Main Board Container */}
      <div className="bg-white rounded-[2rem] p-4 sm:p-8 shadow-sm border border-outline-variant/30 flex flex-col md:flex-row gap-6 items-center justify-center">
        {/* Left: 3x3 Grid — ukuran responsif */}
        <div 
          className="w-64 h-64 sm:w-80 sm:h-80 grid grid-cols-3 gap-1 border border-slate-300 rounded-2xl overflow-hidden shrink-0 relative shadow-md mx-auto"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {pieces.map((p, idx) => {
            const isSelected = selectedPieceIndex === idx;
            const style = getBackgroundStyles(p.correctIndex);
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                key={p.correctIndex} // using correctIndex as key so Framer tracks the tile's movement
                onClick={() => handleTileClick(idx)}
                style={style}
                className={`w-full h-full cursor-pointer relative border ${
                  isSelected ? 'border-primary ring-2 ring-primary border-transparent z-10 scale-105' : 'border-transparent hover:brightness-105 z-0'
                }`}
              >
                {/* Visual grid line guides */}
                <div className="absolute top-1 left-1 text-[9px] bg-black/45 text-white px-1 py-px rounded-md font-bold select-none leading-none">
                  {p.correctIndex + 1}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Side: Hidden Fact reveal or controls */}
        <div className="flex-1 space-y-4 w-full">
          {isFinished ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Puzzle Tersusun Sempurna!</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {factText}
              </p>
              
              {rewardData && (
                <div className="bg-white p-3 rounded-xl border border-emerald-500/10 flex justify-around text-center text-xs font-bold">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">XP</span>
                    <span className="text-primary font-extrabold">+{rewardData.xpEarned}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Poin</span>
                    <span className="text-tertiary-container font-extrabold">+{rewardData.pointsEarned}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/game')}
                className="w-full bg-primary hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-sm"
              >
                Kembali ke Game Center
              </button>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Lightbulb className="w-5 h-5 text-yellow-500 fill-current" />
                <span>Pesan Rahasia Terkunci</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Susun gambar di sebelah kiri untuk membuka pesan penting dan fakta ilmiah seputar penanganan dan pengobatan HIV/AIDS.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  ℹ️
                </div>
                <span>Setiap puzzle selesai memberi +120 XP</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
