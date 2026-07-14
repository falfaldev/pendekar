import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Game } from '../../services/api';
import { ShieldCheck, ArrowLeft, RefreshCw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Item {
  text: string;
  correctCategory: string;
}

export default function DragDrop() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Track dropped items per category
  // e.g. { 'Pencegahan': ['Kondom', 'Jarum Steril'], 'Penularan': [] }
  const [placedItems, setPlacedItems] = useState<Record<string, string[]>>({});
  const [unplacedItems, setUnplacedItems] = useState<string[]>([]);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  
  const [score, setScore] = useState(0);
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
          if (data && data.items) {
            setItems(data.items);
            setCategories(data.categories || ['Pencegahan', 'Penularan', 'Aman']);
            resetGame(data.items, data.categories || ['Pencegahan', 'Penularan', 'Aman']);
          }
        }
      } catch (err) {
        console.error('Error loading drag and drop game:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadGame();
  }, [id]);

  // ── State untuk tap-to-select (mobile friendly) ──
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const resetGame = (gameItems: Item[], cats: string[]) => {
    const initialPlaced: Record<string, string[]> = {};
    cats.forEach(c => { initialPlaced[c] = []; });
    setPlacedItems(initialPlaced);
    setDragOverCategory(null);
    setSelectedItem(null);
    const texts = gameItems.map(i => i.text).sort(() => Math.random() - 0.5);
    setUnplacedItems(texts);
    setIsFinished(false);
    setRewardData(null);
    setScore(0);
  };

  // ── Drag handlers (desktop) ──
  const handleDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData('text/plain', text);
  };
  const handleDragOver = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDragOverCategory(category);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCategory(null);
  };
  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    setDragOverCategory(null);
    const itemText = e.dataTransfer.getData('text/plain');
    if (!itemText) return;
    moveItemToCategory(itemText, targetCategory);
  };

  // ── Tap handlers (mobile) ──
  const handleItemTap = (text: string) => {
    // Kalau item sudah dipilih sebelumnya, batalkan pilihan
    setSelectedItem(prev => prev === text ? null : text);
  };

  const handleCategoryTap = (category: string) => {
    if (!selectedItem) return;
    moveItemToCategory(selectedItem, category);
    setSelectedItem(null);
  };

  // ── Logic pindah item ──
  const moveItemToCategory = (itemText: string, targetCategory: string) => {
    const nextUnplaced = unplacedItems.filter(i => i !== itemText);
    const nextPlaced: Record<string, string[]> = {};
    Object.keys(placedItems).forEach(cat => {
      nextPlaced[cat] = placedItems[cat].filter(i => i !== itemText);
    });
    nextPlaced[targetCategory].push(itemText);
    setUnplacedItems(nextUnplaced);
    setPlacedItems(nextPlaced);
  };

  // Move back to unplaced pool when clicked
  const handleRemoveItem = (itemText: string, fromCategory: string) => {
    const nextPlaced = {
      ...placedItems,
      [fromCategory]: placedItems[fromCategory].filter(i => i !== itemText)
    };
    setPlacedItems(nextPlaced);
    setUnplacedItems([...unplacedItems, itemText]);
  };

  const handleSubmit = async () => {
    // Score validation
    let correctCount = 0;
    
    Object.keys(placedItems).forEach(cat => {
      placedItems[cat].forEach(text => {
        const matchingItem = items.find(i => i.text === text);
        if (matchingItem && matchingItem.correctCategory === cat) {
          correctCount++;
        }
      });
    });

    const finalScore = items.length > 0 ? Math.round((correctCount / items.length) * 100) : 0;
    setScore(finalScore);

    try {
      const res = await api.submitGameResult(game!.id, finalScore, currentLevel);
      setRewardData(res);
      setCurrentLevel(res.nextLevel || currentLevel);
      setIsFinished(true);
    } catch (err) {
      console.error('Error submitting drag drop score:', err);
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

  if (!game || items.length === 0) {
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
            <h2 className="font-headline-sm text-xl font-extrabold text-on-surface">Klasifikasi Tuntas!</h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Kamu berhasil mengelompokkan tindakan medis dan aktivitas sosial.
            </p>
          </div>

          <div className="py-4">
            <div className="text-5xl font-extrabold text-primary">{score}</div>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-2">Skor Pengelompokan</p>
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
              onClick={() => resetGame(items, categories)}
              className="py-3 border border-outline-variant/30 text-on-surface rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Ulangi Game
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Game navigation and reset */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/game')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar Permainan
        </button>
        <button 
          onClick={() => resetGame(items, categories)} 
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-indigo-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Restart
        </button>
      </div>

      <div className="text-center">
        <h2 className="font-bold text-lg text-slate-800">Pilih & Letakkan</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Ketuk item di bawah lalu ketuk kolom tujuan. Level saat ini: {currentLevel}.
        </p>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-2 inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-4 py-1.5 rounded-full text-xs font-bold"
          >
            <span>Dipilih:</span>
            <span className="bg-primary text-white px-2 py-0.5 rounded-lg">{selectedItem}</span>
            <button onClick={() => setSelectedItem(null)} className="text-primary/60 hover:text-primary ml-1">✕</button>
          </motion.div>
        )}
      </div>

      {/* Main Board Layout — responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {categories.map(cat => {
          const count = placedItems[cat]?.length || 0;
          const isOver = dragOverCategory === cat;
          const isTarget = !!selectedItem; // ada item dipilih
          
          return (
            <motion.div
              key={cat}
              animate={{ scale: isOver ? 1.02 : 1 }}
              transition={{ duration: 0.2 }}
              onDragOver={(e: any) => handleDragOver(e, cat)}
              onDragLeave={handleDragLeave}
              onDrop={(e: any) => handleDrop(e, cat)}
              onClick={() => handleCategoryTap(cat)}
              className={`bg-white rounded-2xl p-4 border-2 border-dashed min-h-[180px] sm:min-h-[250px] flex flex-col shadow-sm transition-all cursor-pointer ${
                isOver
                  ? 'border-primary bg-indigo-50/50 scale-[1.02]'
                  : isTarget
                    ? 'border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10'
                    : 'border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              <h3 className={`font-bold text-sm text-center mb-3 pb-2 border-b border-outline-variant/10 uppercase tracking-wider ${
                cat === 'Pencegahan' ? 'text-indigo-700' : cat === 'Penularan' ? 'text-red-700' : 'text-emerald-700'
              }`}>
                {cat} ({count})
                {isTarget && <span className="block text-[10px] text-primary/60 normal-case font-normal mt-0.5">Ketuk untuk letakkan</span>}
              </h3>
              
              <div className="flex-1 flex flex-wrap gap-2 content-start">
                {placedItems[cat]?.map(itemText => (
                  <motion.div
                    key={itemText}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(itemText, cat); }}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 active:bg-red-50 active:border-red-200 active:text-red-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>{itemText}</span>
                    <span className="text-[10px] text-slate-400">✕</span>
                  </motion.div>
                ))}
                
                {count === 0 && (
                  <div className="w-full flex items-center justify-center text-center py-8 pointer-events-none">
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${isTarget ? 'text-primary/50' : 'text-slate-300'}`}>
                      {isTarget ? '↑ Ketuk kolom ini' : 'Kosong'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Unplaced Items Pool */}
      <div className="bg-white rounded-[2rem] p-5 border border-outline-variant/30 shadow-sm space-y-3">
        <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
          Item untuk diklasifikasikan — ketuk untuk memilih:
        </h4>
        
        <div className="flex flex-wrap gap-2.5 min-h-[50px]">
          {unplacedItems.map(itemText => (
            <motion.div
              layout
              key={itemText}
              draggable
              onDragStart={(e: any) => handleDragStart(e, itemText)}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleItemTap(itemText)}
              className={`px-4 py-3 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer select-none min-h-[44px] flex items-center ${
                selectedItem === itemText
                  ? 'bg-yellow-400 text-slate-900 ring-2 ring-yellow-500 scale-105 shadow-lg'
                  : 'bg-primary text-white hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {selectedItem === itemText ? `✓ ${itemText}` : itemText}
            </motion.div>
          ))}
          
          {unplacedItems.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-emerald-600 font-bold py-2"
            >
              🎉 Semua item telah ditempatkan! Periksa hasil di bawah.
            </motion.p>
          )}
        </div>
      </div>

      {/* Action Submit */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleSubmit}
          disabled={unplacedItems.length > 0}
          className={`px-8 py-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            unplacedItems.length === 0
              ? 'bg-primary text-white hover:bg-indigo-700 shadow-lg shadow-primary/20 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Periksa Hasil Klasifikasi
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
