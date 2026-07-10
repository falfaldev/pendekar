import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { HealthService } from '../../services/api';
import { Heart, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function ManageLayanan() {
  const [services, setServices] = useState<HealthService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formNama, setFormNama] = useState('');
  const [formTipe, setFormTipe] = useState<'puskesmas' | 'rumah_sakit' | 'hotline'>('puskesmas');
  const [formAlamat, setFormAlamat] = useState('');
  const [formTelepon, setFormTelepon] = useState('');
  const [formJamLayanan, setFormJamLayanan] = useState('');
  const [formKoordinat, setFormKoordinat] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const list = await api.getHealthServices();
      setServices(list);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditId(null);
    setFormNama('');
    setFormTipe('puskesmas');
    setFormAlamat('');
    setFormTelepon('');
    setFormJamLayanan('');
    setFormKoordinat('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: HealthService) => {
    setEditId(s.id);
    setFormNama(s.nama);
    setFormTipe(s.tipe);
    setFormAlamat(s.alamat || '');
    setFormTelepon(s.telepon || '');
    setFormJamLayanan(s.jam_layanan || '');
    setFormKoordinat(s.koordinat_lokasi || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama) return;

    const payload = {
      nama: formNama,
      tipe: formTipe,
      alamat: formAlamat || undefined,
      telepon: formTelepon || undefined,
      jam_layanan: formJamLayanan || undefined,
      koordinat_lokasi: formKoordinat || undefined
    };

    try {
      if (editId) {
        await api.updateHealthService(editId, payload);
      } else {
        await api.createHealthService(payload);
      }
      setIsFormOpen(false);
      loadServices();
    } catch (err) {
      console.error('Error saving service:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus layanan kesehatan ini secara permanen?');
    if (!confirm) return;

    try {
      await api.deleteHealthService(id);
      loadServices();
    } catch (err) {
      console.error('Error deleting service:', err);
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
          <h1 className="font-headline-md text-2xl font-bold text-slate-800">Kelola Layanan Kesehatan</h1>
          <p className="text-slate-500 text-sm mt-1">Mengelola VCT clinic puskesmas dan kontak hotline rujukan remaja.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-900/10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Layanan
        </button>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Daftar Layanan Rujukan ({services.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nama Layanan</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Telepon</th>
                <th className="px-6 py-4">Jam Buka</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-600">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{s.nama}</p>
                    {s.alamat && <p className="text-[10px] text-slate-400 mt-0.5">{s.alamat}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      s.tipe === 'hotline' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {s.tipe}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{s.telepon || '-'}</td>
                  <td className="px-6 py-4 font-medium max-w-xs truncate">{s.jam_layanan || '-'}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-500 hover:text-red-500 transition-colors shadow-sm bg-white"
                      title="Edit Layanan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors shadow-sm bg-white"
                      title="Hapus Layanan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-headline-sm text-lg font-bold text-slate-800 mb-6">
              {editId ? 'Ubah Rujukan Layanan' : 'Tambah Rujukan Layanan'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Layanan
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Puskesmas Tebet"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tipe Layanan
                  </label>
                  <select
                    value={formTipe}
                    onChange={(e) => setFormTipe(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  >
                    <option value="puskesmas">Puskesmas</option>
                    <option value="rumah_sakit">Rumah Sakit</option>
                    <option value="hotline">Hotline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat Lengkap (Opsional)
                </label>
                <textarea
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nomor Telepon / Hotline
                  </label>
                  <input
                    type="text"
                    value={formTelepon}
                    onChange={(e) => setFormTelepon(e.target.value)}
                    placeholder="Contoh: (021) 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Kerja / Layanan
                  </label>
                  <input
                    type="text"
                    value={formJamLayanan}
                    onChange={(e) => setFormJamLayanan(e.target.value)}
                    placeholder="Contoh: Senin - Jumat: 08:00 - 15:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Koordinat Lokasi Lat,Lng (Opsional)
                </label>
                <input
                  type="text"
                  value={formKoordinat}
                  onChange={(e) => setFormKoordinat(e.target.value)}
                  placeholder="-6.2295,106.8485"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-on-surface hover:bg-slate-50 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" /> Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
