import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Material, Category } from '../services/api';
import { ArrowLeft, CheckCircle2, FileText, Sparkles, MessageSquare, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MateriDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewardData, setRewardData] = useState<{ xpGained: number; pointGained: number; leveledUp: boolean }>({ xpGained: 0, pointGained: 0, leveledUp: false });
  const [comments, setComments] = useState<any[]>([
    { id: 1, author: 'Dinda Putri', text: 'Sangat bermanfaat! Penjelasannya mudah dipahami buat anak sekolah.', date: '1 jam yang lalu' },
    { id: 2, author: 'Bima Pratama', text: 'Baru tahu kalau nyamuk ternyata tidak menularkan HIV. Mitosnya seram banget sebelumnya.', date: '2 jam yang lalu' }
  ]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadDetail() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const mat = await api.getMaterialBySlug(slug);
        if (mat) {
          setMaterial(mat);
          const comp = await api.isMaterialCompleted(mat.id);
          setIsCompleted(comp);

          const cats = await api.getCategories();
          const cat = cats.find(c => c.id === mat.kategori_id);
          if (cat) setCategory(cat);
        }
      } catch (err) {
        console.error('Error loading material detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [slug]);

  const handleUnderstand = async () => {
    if (!material) return;
    try {
      const res = await api.markMaterialAsCompleted(material.id);
      setIsCompleted(true);
      setRewardData(res);
      setShowCompletionModal(true);
    } catch (err) {
      console.error('Error marking material as completed:', err);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments([
      ...comments,
      {
        id: comments.length + 1,
        author: 'Kamu',
        text: newComment,
        date: 'Baru saja'
      }
    ]);
    setNewComment('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Materi Tidak Ditemukan</h2>
        <button 
          onClick={() => navigate('/materi')}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-xl"
        >
          Kembali ke Daftar Materi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/materi')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Materi Edukasi
      </button>

      {/* Hero Header */}
      <div className="space-y-3">
        {category && (
          <span className="text-primary font-bold text-xs uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
            {category.nama}
          </span>
        )}
        <h1 className="font-headline-md text-2xl md:text-3xl font-extrabold text-on-surface leading-tight">
          {material.judul}
        </h1>
        <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
          {material.deskripsi}
        </p>
      </div>

      {/* Video section */}
      {material.video_url && (
        <div className="rounded-[2rem] overflow-hidden bg-slate-900 border border-outline-variant/30 shadow-md relative pt-[56.25%] w-full">
          <iframe
            src={material.video_url}
            title={material.judul}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      )}

      {/* Content Article Body */}
      <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-outline-variant/20 space-y-6">
        {/* Render clean text with manual styles */}
        <article className="prose prose-indigo max-w-none text-on-surface text-sm md:text-base leading-relaxed whitespace-pre-line">
          {material.konten}
        </article>

        {/* Infographics showcase if available */}
        {material.infographic_url && (
          <div className="space-y-3 pt-6 border-t border-outline-variant/10">
            <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Infografis Ringkasan
            </h4>
            <div className="rounded-2xl overflow-hidden border border-outline-variant/25 max-w-lg mx-auto bg-slate-50">
              <img
                src={material.infographic_url}
                alt="Infografis"
                className="w-full object-contain"
              />
            </div>
          </div>
        )}

        {/* PDF Resources */}
        {material.pdf_url && (
          <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Modul Pendamping PDF</p>
                <p className="text-[10px] text-slate-500">Materi PDF Pendidikan Remaja Cerdas</p>
              </div>
            </div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert('Mengunduh materi pembelajaran...'); }}
              className="bg-white border border-outline-variant/30 hover:border-primary text-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Unduh
            </a>
          </div>
        )}

        {/* Understand Confirmation action */}
        <div className="pt-8 border-t border-outline-variant/10 text-center">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold bg-emerald-50 py-3 px-6 rounded-2xl border border-emerald-100 w-fit mx-auto">
              <CheckCircle2 className="w-6 h-6 fill-emerald-50" />
              <span>Materi Ini Sudah Dipahami</span>
            </div>
          ) : (
            <button
              onClick={handleUnderstand}
              className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98] mx-auto"
            >
              <CheckCircle2 className="w-5 h-5" />
              Saya Sudah Memahami Materi Ini
            </button>
          )}
        </div>
      </div>

      {/* Discussion Section */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-outline-variant/20 space-y-6">
        <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Ruang Komentar & Diskusi
        </h3>
        
        {/* Comment list */}
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                {c.author[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-on-surface">{c.author}</span>
                  <span className="text-[9px] text-on-surface-variant/70">{c.date}</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis pendapat atau pertanyaanmu..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-surface-container/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors"
            required
          />
          <button
            type="submit"
            className="bg-primary hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-sm shrink-0"
          >
            Kirim
          </button>
        </form>
      </div>

      {/* Completion Rewards Modal Overlay */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center border border-white/20 shadow-2xl space-y-6"
            >
              <div className="w-20 h-20 bg-indigo-50 border border-primary/10 rounded-full mx-auto flex items-center justify-center text-primary relative">
                <Sparkles className="w-10 h-10 animate-pulse text-indigo-600" />
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full scale-125 -z-10 animate-ping" />
              </div>

              <div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">Pembelajaran Selesai!</h3>
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Hebat! Kamu telah menyelesaikan modul belajar dan memperoleh wawasan kesehatan baru.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-center">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">XP Diperoleh</p>
                  <p className="text-primary text-xl font-extrabold mt-1">+{rewardData.xpGained} XP</p>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Bonus Poin</p>
                  <p className="text-tertiary-container text-xl font-extrabold mt-1">+{rewardData.pointGained} Pts</p>
                </div>
              </div>

              {rewardData.leveledUp && (
                <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-800 rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
                  <span>🎉 Naik ke Level Selanjutnya! 🎉</span>
                </div>
              )}

              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                Lanjutkan Belajar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
