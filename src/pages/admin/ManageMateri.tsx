import React, { useEffect, useState } from 'react';
import { api, normalizeVideoUrl } from '../../services/api';
import type { Material, Category } from '../../services/api';
import { BookOpen, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function ManageMateri() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formInfographicUrl, setFormInfographicUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formThumbnailFile, setFormThumbnailFile] = useState<File | null>(null);
  const [formInfographicFile, setFormInfographicFile] = useState<File | null>(null);
  const [formXpReward, setFormXpReward] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const cats = await api.getCategories();
      const mats = await api.getMaterials();
      setCategories(cats);
      setMaterials(mats);
      if (cats.length > 0) {
        setFormCategory(cats[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormTitle('');
    setFormSlug('');
    setFormDesc('');
    setFormContent('');
    setFormVideoUrl('');
    setFormPdfUrl('');
    setFormInfographicUrl('');
    setFormThumbnailUrl('');
    setFormThumbnailFile(null);
    setFormInfographicFile(null);
    setFormXpReward(50);
    setSubmitError('');
    if (categories.length > 0) setFormCategory(categories[0].id);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditId(m.id);
    setFormCategory(m.kategori_id);
    setFormTitle(m.judul);
    setFormSlug(m.slug);
    setFormDesc(m.deskripsi);
    setFormContent(m.konten);
    setFormVideoUrl(m.video_url || '');
    setFormPdfUrl(m.pdf_url || '');
    setFormInfographicUrl(m.infographic_url || '');
    setFormThumbnailUrl(m.thumbnail_url || '');
    setFormThumbnailFile(null);
    setFormInfographicFile(null);
    setFormXpReward(m.xp_reward);
    setSubmitError('');
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    // Auto slugify
    const slug = val.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormSlug(slug);
  };

  const handleThumbnailFileChange = (file: File | null) => {
    setFormThumbnailFile(file);
    if (file) {
      setFormThumbnailUrl('');
    }
  };

  const handleInfographicFileChange = (file: File | null) => {
    setFormInfographicFile(file);
    if (file) {
      setFormInfographicUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory || !formTitle || !formContent) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Upload files if provided — fallback to URL on failure
      let thumbnailUrl = formThumbnailUrl;
      let infographicUrl = formInfographicUrl;

      if (formThumbnailFile) {
        try {
          thumbnailUrl = await api.uploadMaterialAsset(formThumbnailFile, 'thumbnail');
        } catch {
          // If upload fails, use data URL as fallback
          thumbnailUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(formThumbnailFile);
          });
        }
      }

      if (formInfographicFile) {
        try {
          infographicUrl = await api.uploadMaterialAsset(formInfographicFile, 'infographic');
        } catch {
          infographicUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(formInfographicFile);
          });
        }
      }

      const payload: Omit<Material, 'id'> = {
        kategori_id: formCategory,
        judul: formTitle,
        slug: formSlug,
        deskripsi: formDesc,
        konten: formContent,
        video_url: formVideoUrl ? normalizeVideoUrl(formVideoUrl) : null as any,
        pdf_url: formPdfUrl || null as any,
        infographic_url: infographicUrl || null as any,
        thumbnail_url: thumbnailUrl || null as any,
        xp_reward: Number(formXpReward)
      };

      // Strip null values so Supabase doesn't complain about optional columns
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== '')
      ) as Omit<Material, 'id'>;

      if (editId) {
        await api.updateMaterial(editId, cleanPayload);
      } else {
        await api.createMaterial(cleanPayload);
      }

      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error saving material:', err);
      setSubmitError(err.message || 'Gagal menyimpan materi. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus materi edukasi ini secara permanen?');
    if (!confirm) return;

    try {
      await api.deleteMaterial(id);
      loadData();
    } catch (err) {
      console.error('Error deleting material:', err);
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
          <h1 className="font-headline-md text-2xl font-bold text-slate-800">Kelola Materi Edukasi</h1>
          <p className="text-slate-500 text-sm mt-1">Mengelola modul pembelajaran interaktif remaja cerdas.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-900/10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Materi
        </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-600" />
            Daftar Modul ({materials.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Judul Modul</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4 text-center">Reward XP</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-600">
              {materials.map((m) => {
                const catName = categories.find(c => c.id === m.kategori_id)?.nama || 'Umum';
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">{m.judul}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {catName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium font-mono">{m.slug}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">+{m.xp_reward} XP</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-500 hover:text-red-500 transition-colors shadow-sm bg-white"
                        title="Edit Modul"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors shadow-sm bg-white"
                        title="Hapus Modul"
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

      {/* Slide Modal Editor */}
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
              {editId ? 'Ubah Materi Pembelajaran' : 'Tambah Materi Pembelajaran'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kategori Pelajaran
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Judul Modul
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Slug Link (Otomatis)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    XP Reward Modul
                  </label>
                  <input
                    type="number"
                    value={formXpReward}
                    onChange={(e) => setFormXpReward(Number(e.target.value) || 50)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Deskripsi Singkat (Kartu Grid)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Konten Edukasi (Artikel / Teks Detail)
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  placeholder="Gunakan teks berparagraf..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Thumbnail Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleThumbnailFileChange(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs file:text-xs file:font-semibold file:border-0 file:bg-red-600 file:text-white file:px-3 file:py-2 file:rounded-xl focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih file lokal untuk upload. Jika tidak, isi URL langsung di bawah.
                  </p>
                  <input
                    type="text"
                    value={formThumbnailUrl}
                    onChange={(e) => {
                      setFormThumbnailUrl(e.target.value);
                      if (e.target.value) setFormThumbnailFile(null);
                    }}
                    placeholder="Atau tempel URL gambar..."
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Video Link (YouTube / Vimeo)
                  </label>
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... atau https://vimeo.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Link akan dinormalisasi menjadi format embed otomatis.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Infografis Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInfographicFileChange(e.target.files?.[0] || null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs file:text-xs file:font-semibold file:border-0 file:bg-red-600 file:text-white file:px-3 file:py-2 file:rounded-xl focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Jika ingin upload infographic lokal, gunakan file picker.
                  </p>
                  <input
                    type="text"
                    value={formInfographicUrl}
                    onChange={(e) => {
                      setFormInfographicUrl(e.target.value);
                      if (e.target.value) setFormInfographicFile(null);
                    }}
                    placeholder="Atau tempel URL infografis..."
                    className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Modul PDF Link
                  </label>
                  <input
                    type="text"
                    value={formPdfUrl}
                    onChange={(e) => setFormPdfUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                {submitError && (
                  <p className="text-xs text-red-600 font-bold flex-1 flex items-center">{submitError}</p>
                )}
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-on-surface hover:bg-slate-50 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Modul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
