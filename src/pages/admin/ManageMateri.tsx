import React, { useEffect, useState } from 'react';
import { api, normalizeVideoUrl } from '../../services/api';
import type { Material, Category } from '../../services/api';
import { BookOpen, Plus, Edit2, Trash2, X, Save, FileText, Upload, AlertCircle } from 'lucide-react';

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB

export default function ManageMateri() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formInfographicUrl, setFormInfographicUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formThumbnailFile, setFormThumbnailFile] = useState<File | null>(null);
  const [formInfographicFile, setFormInfographicFile] = useState<File | null>(null);
  const [formXpReward, setFormXpReward] = useState(50);

  // PDF states — ganti URL menjadi file upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState('');
  const [existingPdfName, setExistingPdfName] = useState('');
  const [pdfError, setPdfError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const cats = await api.getCategories();
      const mats = await api.getMaterials();
      setCategories(cats);
      setMaterials(mats);
      if (cats.length > 0) setFormCategory(cats[0].id);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle(''); setFormSlug(''); setFormDesc(''); setFormContent('');
    setFormVideoUrl(''); setFormInfographicUrl(''); setFormThumbnailUrl('');
    setFormThumbnailFile(null); setFormInfographicFile(null); setFormXpReward(50);
    setPdfFile(null); setExistingPdfUrl(''); setExistingPdfName('');
    setPdfError(''); setSubmitError('');
    if (categories.length > 0) setFormCategory(categories[0].id);
  };

  const handleOpenCreate = () => { setEditId(null); resetForm(); setIsFormOpen(true); };

  const handleOpenEdit = (m: Material) => {
    setEditId(m.id);
    setFormCategory(m.kategori_id);
    setFormTitle(m.judul);
    setFormSlug(m.slug);
    setFormDesc(m.deskripsi);
    setFormContent(m.konten);
    setFormVideoUrl(m.video_url || '');
    setFormInfographicUrl(m.infographic_url || '');
    setFormThumbnailUrl(m.thumbnail_url || '');
    setFormThumbnailFile(null);
    setFormInfographicFile(null);
    setFormXpReward(m.xp_reward);
    setPdfFile(null);
    setExistingPdfUrl(m.pdf_url || '');
    setExistingPdfName(m.pdf_file_name || '');
    setPdfError(''); setSubmitError('');
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormSlug(slug);
  };

  const handlePdfFileChange = (file: File | null) => {
    setPdfError('');
    if (!file) { setPdfFile(null); return; }
    if (file.type !== 'application/pdf') { setPdfError('Hanya file PDF yang diizinkan.'); return; }
    if (file.size > MAX_PDF_SIZE) { setPdfError('Ukuran file melebihi batas 20 MB.'); return; }
    setPdfFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory || !formTitle || !formContent) return;
    if (pdfError) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      let thumbnailUrl = formThumbnailUrl;
      let infographicUrl = formInfographicUrl;
      let pdfUrl = existingPdfUrl;
      let pdfFileName = existingPdfName;
      let pdfFileSize: number | undefined = undefined;

      if (formThumbnailFile) {
        try { thumbnailUrl = await api.uploadMaterialAsset(formThumbnailFile, 'thumbnail'); }
        catch { thumbnailUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = (ev) => res(ev.target?.result as string); r.readAsDataURL(formThumbnailFile); }); }
      }
      if (formInfographicFile) {
        try { infographicUrl = await api.uploadMaterialAsset(formInfographicFile, 'infographic'); }
        catch { infographicUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = (ev) => res(ev.target?.result as string); r.readAsDataURL(formInfographicFile); }); }
      }

      // Upload PDF jika ada file baru
      if (pdfFile) {
        const uploaded = await api.uploadPdf(pdfFile);
        pdfUrl = uploaded.url;
        pdfFileName = uploaded.fileName;
        pdfFileSize = uploaded.fileSize;
      }

      const payload: any = {
        kategori_id: formCategory,
        judul: formTitle,
        slug: formSlug,
        deskripsi: formDesc,
        konten: formContent,
        video_url: formVideoUrl ? normalizeVideoUrl(formVideoUrl) : null,
        infographic_url: infographicUrl || null,
        thumbnail_url: thumbnailUrl || null,
        pdf_url: pdfUrl || null,
        pdf_file_name: pdfFileName || null,
        pdf_file_size: pdfFileSize ?? null,
        xp_reward: Number(formXpReward),
      };

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== '')
      );

      if (editId) { await api.updateMaterial(editId, cleanPayload as any); }
      else { await api.createMaterial(cleanPayload as any); }

      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal menyimpan materi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus materi ini secara permanen?')) return;
    try { await api.deleteMaterial(id); loadData(); }
    catch (err) { console.error(err); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-slate-800">Kelola Materi Edukasi</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola modul pembelajaran dan upload file PDF materi.</p>
        </div>
        <button onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 shrink-0">
          <Plus className="w-4 h-4" /> Tambah Materi
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-600" /> Daftar Modul ({materials.length})
          </h3>
        </div>
        {/* Mobile card list */}
        <div className="block sm:hidden divide-y divide-slate-200">
          {materials.map((m) => {
            const catName = categories.find(c => c.id === m.kategori_id)?.nama || 'Umum';
            return (
              <div key={m.id} className="px-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 leading-tight">{m.judul}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{catName}</span>
                      <span className="text-[10px] font-bold text-slate-500">+{m.xp_reward} XP</span>
                      {m.pdf_url && <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold"><FileText className="w-3 h-3" /> PDF</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleOpenEdit(m)} className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:border-red-500 hover:text-red-500 transition-colors bg-white min-w-[40px] min-h-[40px] flex items-center justify-center"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors bg-white min-w-[40px] min-h-[40px] flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Judul Modul</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">PDF</th>
                <th className="px-6 py-4 text-center">XP</th>
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
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{catName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {m.pdf_url ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <FileText className="w-3 h-3" /> Ada PDF
                          </span>
                          {m.pdf_file_size && (
                            <span className="text-[9px] text-slate-400">{formatFileSize(m.pdf_file_size)}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">+{m.xp_reward} XP</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(m)}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-500 hover:text-red-500 transition-colors shadow-sm bg-white" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors shadow-sm bg-white" title="Hapus">
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

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2">
              <X className="w-6 h-6" />
            </button>
            <h2 className="font-headline-sm text-lg font-bold text-slate-800 mb-6">
              {editId ? 'Ubah Materi' : 'Tambah Materi Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kategori + Judul */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Judul Modul</label>
                  <input type="text" value={formTitle} onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" required />
                </div>
              </div>

              {/* Slug + XP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Slug (Otomatis)</label>
                  <input type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-mono" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">XP Reward</label>
                  <input type="number" value={formXpReward} onChange={(e) => setFormXpReward(Number(e.target.value) || 50)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" required />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi Singkat</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none" required />
              </div>

              {/* Konten */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Konten Artikel</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" required />
              </div>

              {/* Thumbnail + Video */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Thumbnail</label>
                  <input type="file" accept="image/*" onChange={(e) => { setFormThumbnailFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setFormThumbnailUrl(''); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs file:text-xs file:font-semibold file:border-0 file:bg-red-600 file:text-white file:px-3 file:py-2 file:rounded-xl" />
                  <input type="text" value={formThumbnailUrl} onChange={(e) => { setFormThumbnailUrl(e.target.value); if (e.target.value) setFormThumbnailFile(null); }}
                    placeholder="Atau tempel URL gambar..." className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link Video YouTube</label>
                  <input type="text" value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" />
                  <p className="text-[10px] text-slate-400 mt-1">Otomatis dikonversi ke format embed.</p>
                </div>
              </div>

              {/* Infografis */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Infografis</label>
                <input type="file" accept="image/*" onChange={(e) => { setFormInfographicFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setFormInfographicUrl(''); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs file:text-xs file:font-semibold file:border-0 file:bg-red-600 file:text-white file:px-3 file:py-2 file:rounded-xl" />
                <input type="text" value={formInfographicUrl} onChange={(e) => { setFormInfographicUrl(e.target.value); if (e.target.value) setFormInfographicFile(null); }}
                  placeholder="Atau tempel URL infografis..." className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none" />
              </div>

              {/* ── UPLOAD PDF ── */}
              <div className="border-t border-slate-200 pt-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  File PDF Materi (Opsional · Maks. 20 MB)
                </label>

                {/* Tampilkan PDF yang sudah ada */}
                {existingPdfUrl && !pdfFile && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-3">
                    <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{existingPdfName || 'File PDF'}</p>
                      <p className="text-[10px] text-blue-600">PDF sudah ada — upload baru untuk mengganti</p>
                    </div>
                    <button type="button" onClick={() => { setExistingPdfUrl(''); setExistingPdfName(''); }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Drop zone upload */}
                <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${
                  pdfError ? 'border-red-300 bg-red-50' : pdfFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-primary hover:bg-primary/5'
                }`}>
                  <input type="file" accept="application/pdf" className="sr-only"
                    onChange={(e) => handlePdfFileChange(e.target.files?.[0] || null)} />
                  {pdfFile ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-emerald-700">{pdfFile.name}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5">{formatFileSize(pdfFile.size)} — Siap diupload</p>
                      </div>
                      <button type="button" onClick={(e) => { e.preventDefault(); setPdfFile(null); }}
                        className="text-[10px] font-bold text-red-500 hover:underline">Hapus file</button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-slate-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-700">Klik untuk pilih file PDF</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Hanya .pdf · Maksimal 20 MB</p>
                      </div>
                    </>
                  )}
                </label>

                {pdfError && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-xs font-bold">{pdfError}</p>
                  </div>
                )}
              </div>

              {/* Tombol aksi */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                {submitError && <p className="text-xs text-red-600 font-bold flex-1 flex items-center">{submitError}</p>}
                <button type="button" onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold text-xs rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting || !!pdfError}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md">
                  {isSubmitting ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
