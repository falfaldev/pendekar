import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Material, Category } from '../services/api';
import { Search, BookOpen, Video, FileText, CheckCircle2 } from 'lucide-react';

export default function MateriList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMaterials() {
      setIsLoading(true);
      try {
        const cats = await api.getCategories();
        const mats = await api.getMaterials();
        
        setCategories(cats);
        setMaterials(mats);

        // Cek semua completion secara paralel sekaligus
        const completions = await Promise.all(mats.map(m => api.isMaterialCompleted(m.id)));
        const map: Record<string, boolean> = {};
        mats.forEach((m, i) => { map[m.id] = completions[i]; });
        setCompletedMap(map);
      } catch (err) {
        console.error('Error loading materials:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMaterials();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter materials by category and search query
  const filteredMaterials = materials.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.kategori_id === selectedCategory;
    const matchesSearch = m.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-2xl font-bold text-primary">Materi Edukasi</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Pelajari segala hal tentang HIV/AIDS untuk menghentikan stigma buruk di masyarakat.
          </p>
        </div>

        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="w-5 h-5 text-on-surface-variant/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-thin scrollbar-thumb-slate-300">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-5 py-2.5 rounded-full font-bold text-xs shrink-0 transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          Semua Kategori ({materials.length})
        </button>
        {categories.map((cat) => {
          const count = materials.filter(m => m.kategori_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-bold text-xs shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border border-outline-variant/20 text-on-surface-variant hover:bg-slate-50'
              }`}
            >
              {cat.nama} ({count})
            </button>
          );
        })}
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-outline-variant/20">
          <BookOpen className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="font-bold text-on-surface text-base">Tidak Ada Materi Ditemukan</h3>
          <p className="text-xs text-on-surface-variant mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((m) => {
            const isCompleted = completedMap[m.id];
            const catName = categories.find(c => c.id === m.kategori_id)?.nama || 'Umum';
            return (
              <div 
                key={m.id}
                onClick={() => navigate(`/materi/${m.slug}`)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/30 flex flex-col hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer group"
              >
                {/* Thumbnail Image */}
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  <img
                    src={m.thumbnail_url || 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=400'}
                    alt={m.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-primary/95 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                    {catName}
                  </div>
                  {isCompleted && (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1 rounded-full shadow-sm flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 fill-emerald-50 text-emerald-500" />
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-on-surface leading-snug group-hover:text-primary transition-colors">
                      {m.judul}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                      {m.deskripsi}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-outline-variant/10 text-[10px] font-bold text-on-surface-variant">
                    <div className="flex items-center gap-3">
                      {m.video_url && (
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-red-500" /> Video
                        </span>
                      )}
                      {m.pdf_url && (
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          <FileText className="w-3.5 h-3.5" /> Baca PDF
                        </span>
                      )}
                    </div>
                    <span className="text-primary-container bg-primary/5 px-2.5 py-1 rounded-full uppercase font-extrabold tracking-wider">
                      +{m.xp_reward} XP
                    </span>
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
