import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { HealthService } from '../services/api';
import { MapPin, Phone, Clock, Search, ShieldCheck, ExternalLink } from 'lucide-react';

export default function LayananInfo() {
  const [services, setServices] = useState<HealthService[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'clinic' | 'hotline'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      setIsLoading(true);
      try {
        const list = await api.getHealthServices();
        setServices(list);
      } catch (err) {
        console.error('Error loading health services:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter based on search query and category type
  const filteredServices = services.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.alamat && s.alamat.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesType = true;
    if (selectedType === 'clinic') {
      matchesType = s.tipe === 'puskesmas' || s.tipe === 'rumah_sakit';
    } else if (selectedType === 'hotline') {
      matchesType = s.tipe === 'hotline';
    }

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-primary">Layanan Kesehatan VCT & Hotline</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Daftar fasilitas kesehatan terpercaya yang menyediakan tes HIV sukarela (VCT), pengobatan, konseling, dan panggilan hotline darurat.
          </p>
        </div>

        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="w-5 h-5 text-on-surface-variant/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari puskesmas atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${
            selectedType === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          Semua Layanan
        </button>
        <button
          onClick={() => setSelectedType('clinic')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${
            selectedType === 'clinic'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          Puskesmas / Rumah Sakit VCT
        </button>
        <button
          onClick={() => setSelectedType('hotline')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${
            selectedType === 'hotline'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          Hotline Darurat
        </button>
      </div>

      {/* Grid List */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-outline-variant/20">
          <MapPin className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="font-bold text-on-surface text-base">Fasilitas Tidak Ditemukan</h3>
          <p className="text-xs text-on-surface-variant mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map((s) => {
            const isClinic = s.tipe !== 'hotline';
            const mapsUrl = s.koordinat_lokasi 
              ? `https://www.google.com/maps/search/?api=1&query=${s.koordinat_lokasi}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.nama + ' ' + (s.alamat || ''))}`;

            return (
              <div 
                key={s.id}
                className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Visual badge top right */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[5rem] -z-10 pointer-events-none" />

                <div className="space-y-4">
                  <div>
                    <span className={`inline-block font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2 ${
                      isClinic ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {s.tipe.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-base text-slate-800 leading-snug">
                      {s.nama}
                    </h3>
                  </div>

                  {/* Body rows */}
                  <div className="space-y-2.5 text-xs text-on-surface-variant font-medium">
                    {s.alamat && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{s.alamat}</span>
                      </div>
                    )}
                    {s.telepon && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-primary shrink-0" />
                        <span>{s.telepon}</span>
                      </div>
                    )}
                    {s.jam_layanan && (
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{s.jam_layanan}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                    <span>Rahasia Terjamin</span>
                  </div>

                  <div className="flex gap-2">
                    {s.telepon && (
                      <a
                        href={`tel:${s.telepon.replace(/\s+/g, '')}`}
                        className="bg-white border border-outline-variant/30 hover:border-primary text-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                      >
                        Hubungi
                      </a>
                    )}
                    {isClinic && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-primary hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition-colors shadow-md shadow-primary/10 active:scale-95"
                      >
                        Petunjuk Peta <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
