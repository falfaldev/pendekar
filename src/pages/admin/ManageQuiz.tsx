import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Quiz, Material } from '../../services/api';
import { Award, Plus, Trash2, X, Save } from 'lucide-react';

export default function ManageQuiz() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizMaterialId, setQuizMaterialId] = useState('');
  const [quizXpReward, setQuizXpReward] = useState(100);
  const [quizPointsReward, setQuizPointsReward] = useState(50);

  // Dynamic question inputs
  const [questions, setQuestions] = useState<Array<{
    pertanyaan: string;
    opsi_a: string;
    opsi_b: string;
    opsi_c: string;
    opsi_d: string;
    jawaban_benar: 'A' | 'B' | 'C' | 'D';
  }>>([
    { pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', jawaban_benar: 'A' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const qList = await api.getQuizzes();
      const mList = await api.getMaterials();
      setQuizzes(qList);
      setMaterials(mList);
      if (mList.length > 0) {
        setQuizMaterialId(mList[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setQuizTitle('');
    setQuizDesc('');
    setQuizXpReward(100);
    setQuizPointsReward(50);
    if (materials.length > 0) setQuizMaterialId(materials[0].id);
    setQuestions([{ pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', jawaban_benar: 'A' }]);
    setIsFormOpen(true);
  };

  const handleAddQuestionField = () => {
    setQuestions([
      ...questions,
      { pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', jawaban_benar: 'A' }
    ]);
  };

  const handleRemoveQuestionField = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (index: number, key: string, value: string) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      [key]: value
    };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle || questions.some(q => !q.pertanyaan || !q.opsi_a || !q.opsi_b)) {
      alert('Mohon isi judul kuis dan semua data pertanyaan minimal opsi A dan B!');
      return;
    }

    const payloadQuiz = {
      materi_id: quizMaterialId || undefined,
      judul: quizTitle,
      deskripsi: quizDesc,
      xp_reward: Number(quizXpReward),
      points_reward: Number(quizPointsReward)
    };

    try {
      await api.createQuiz(payloadQuiz, questions);
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      console.error('Error creating quiz:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus kuis ini beserta seluruh soalnya?');
    if (!confirm) return;

    try {
      await api.deleteQuiz(id);
      loadData();
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-slate-800">Kelola Kuis Pelajaran</h1>
          <p className="text-slate-500 text-sm mt-1">Buat kuis evaluasi materi edukasi dan tentukan bobot reward.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-900/10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Kuis
        </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" />
            Daftar Kuis ({quizzes.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Judul Kuis</th>
                <th className="px-6 py-4">Taut Modul</th>
                <th className="px-6 py-4 text-center">Reward XP / Poin</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-600">
              {quizzes.map((q) => {
                const materialTitle = materials.find(m => m.id === q.materi_id)?.judul || 'Materi Umum';
                return (
                  <tr key={q.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">{q.judul}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">{materialTitle}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      +{q.xp_reward} XP • +{q.points_reward} Poin
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors shadow-sm bg-white"
                        title="Hapus Kuis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-headline-sm text-lg font-bold text-slate-800 mb-6">
              Tambah Kuis Baru
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quiz Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Judul Kuis
                  </label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Contoh: Kuis Pencegahan HIV"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tautkan ke Modul Pelajaran
                  </label>
                  <select
                    value={quizMaterialId}
                    onChange={(e) => setQuizMaterialId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  >
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.judul}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    XP Reward Kuis
                  </label>
                  <input
                    type="number"
                    value={quizXpReward}
                    onChange={(e) => setQuizXpReward(Number(e.target.value) || 100)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Poin Reward Kuis
                  </label>
                  <input
                    type="number"
                    value={quizPointsReward}
                    onChange={(e) => setQuizPointsReward(Number(e.target.value) || 50)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Deskripsi Kuis
                </label>
                <textarea
                  value={quizDesc}
                  onChange={(e) => setQuizDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none"
                />
              </div>

              {/* Quiz Questions Section */}
              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Pertanyaan Kuis</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestionField}
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    + Tambah Soal
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionField(idx)}
                        disabled={questions.length === 1}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 disabled:opacity-30"
                      >
                        Hapus Soal
                      </button>

                      <p className="font-bold text-xs text-primary">Soal #{idx + 1}</p>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Pertanyaan
                        </label>
                        <input
                          type="text"
                          value={q.pertanyaan}
                          onChange={(e) => handleQuestionChange(idx, 'pertanyaan', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opsi A</label>
                          <input
                            type="text"
                            value={q.opsi_a}
                            onChange={(e) => handleQuestionChange(idx, 'opsi_a', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opsi B</label>
                          <input
                            type="text"
                            value={q.opsi_b}
                            onChange={(e) => handleQuestionChange(idx, 'opsi_b', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opsi C</label>
                          <input
                            type="text"
                            value={q.opsi_c}
                            onChange={(e) => handleQuestionChange(idx, 'opsi_c', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opsi D</label>
                          <input
                            type="text"
                            value={q.opsi_d}
                            onChange={(e) => handleQuestionChange(idx, 'opsi_d', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Jawaban Benar
                        </label>
                        <select
                          value={q.jawaban_benar}
                          onChange={(e) => handleQuestionChange(idx, 'jawaban_benar', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none font-bold text-slate-700"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-on-surface hover:bg-slate-50 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md animate-fade-in"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan Kuis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
