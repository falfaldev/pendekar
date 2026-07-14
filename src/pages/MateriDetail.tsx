import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Material, Category, Comment } from '../services/api';
import { ArrowLeft, CheckCircle2, FileText, Sparkles, MessageSquare, Send, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MateriDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [material, setMaterial] = useState<Material | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewardData, setRewardData] = useState<{ xpGained: number; pointGained: number; leveledUp: boolean }>({ xpGained: 0, pointGained: 0, leveledUp: false });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadDetail() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const [mat, user] = await Promise.all([
          api.getMaterialBySlug(slug),
          api.getCurrentProfile(),
        ]);
        setCurrentUser(user);
        if (mat) {
          setMaterial(mat);
          const [comp, cats, cmts] = await Promise.all([
            api.isMaterialCompleted(mat.id),
            api.getCategories(),
            api.getComments(mat.id),
          ]);
          setIsCompleted(comp);
          setComments(cmts);
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !material) return;
    setIsSubmittingComment(true);
    try {
      const added = await api.addComment(material.id, newComment);
      setComments(prev => [...prev, added]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim komentar.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
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
      <div className="bg-white rounded-[2rem] p-4 sm:p-6 md:p-10 shadow-sm border border-outline-variant/20 space-y-6">
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

        {/* PDF Modul — langsung tampil inline seperti video */}
        {material.pdf_url && (
          <div className="space-y-3 pt-6 border-t border-outline-variant/10">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Modul PDF — {material.pdf_file_name || 'Materi Pendamping'}
                {material.pdf_file_size && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({(material.pdf_file_size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                )}
              </h4>
              <a
                href={material.pdf_url}
                download={material.pdf_file_name || 'materi.pdf'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary hover:text-indigo-700 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Unduh PDF
              </a>
            </div>

            {/* Inline PDF viewer — ukuran sama seperti video (aspect ratio 16:9) */}
            <div className="rounded-[2rem] overflow-hidden border border-outline-variant/20 shadow-md bg-slate-100 w-full relative pt-[56.25%]">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(material.pdf_url)}&embedded=true`}
                title={material.pdf_file_name || material.judul}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="autoplay"
              />
            </div>
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
          <MessageSquare className="w-5 h-5 text-primary" />
          Ruang Komentar & Diskusi
          <span className="text-xs font-normal text-slate-400">({comments.length})</span>
        </h3>

        {/* Comment list */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada komentar. Jadilah yang pertama!</p>
            </div>
          ) : (
            comments.map((c) => {
              const isOwn = currentUser?.id === c.user_id;
              const isAdmin = currentUser?.role === 'admin';
              return (
                <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 group">
                  {/* Avatar */}
                  <img
                    src={c.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                    alt={c.user_name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-on-surface">{c.user_name}</span>
                        <span className="text-[9px] text-on-surface-variant/70">
                          {new Date(c.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {(isOwn || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 active:text-red-500 transition-all rounded-lg shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Hapus komentar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{c.teks}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          {currentUser?.avatar_url && (
            <img src={currentUser.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Tulis pendapat atau pertanyaanmu..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmittingComment}
              className="flex-1 bg-surface-container/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors"
              required
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="bg-primary hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-3 rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
            >
              {isSubmittingComment
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
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
