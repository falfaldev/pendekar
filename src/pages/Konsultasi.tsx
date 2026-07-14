import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Consultation } from '../services/api';
import { Send, MessageSquare, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Konsultasi() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Consultation | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'answered'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const list = await api.getConsultations();
      setConsultations(list);
      if (list.length > 0 && !selectedTicket) {
        setSelectedTicket(list[0]);
      } else if (selectedTicket) {
        // refresh currently selected ticket
        const updated = list.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Error loading consultations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    try {
      const newTicket = await api.askQuestion(questionText);
      setQuestionText('');
      await loadTickets();
      setSelectedTicket(newTicket);
    } catch (err) {
      console.error('Error asking question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = consultations.filter(c => {
    if (activeTab === 'pending') return c.status === 'pending';
    if (activeTab === 'answered') return c.status === 'answered';
    return true;
  });

  if (isLoading && consultations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-primary">Tanya Konselor Kesehatan</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Konsultasikan pertanyaanmu seputar HIV/AIDS dan kesehatan reproduksi secara pribadi. Hasil obrolan dijamin rahasia dan aman.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Ticket List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col h-[420px] lg:h-[600px]">
          {/* Tabs */}
          <div className="flex border-b border-outline-variant/10 text-center font-bold text-[10px] text-slate-500 bg-slate-50">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 transition-colors ${activeTab === 'all' ? 'bg-white border-b-2 border-primary text-primary' : 'hover:bg-slate-100'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 transition-colors ${activeTab === 'pending' ? 'bg-white border-b-2 border-primary text-primary' : 'hover:bg-slate-100'}`}
            >
              Menunggu ({consultations.filter(c => c.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('answered')}
              className={`flex-1 py-3 transition-colors ${activeTab === 'answered' ? 'bg-white border-b-2 border-primary text-primary' : 'hover:bg-slate-100'}`}
            >
              Terjawab ({consultations.filter(c => c.status === 'answered').length})
            </button>
          </div>

          {/* Tickets Scroll area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-outline-variant/10">
            {filteredTickets.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-12">
                Tidak ada tiket konsultasi.
              </p>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-slate-400 font-bold">
                        {new Date(t.ditanyakan_at).toLocaleDateString('id-ID')}
                      </span>
                      {t.status === 'answered' ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 fill-current" /> Terjawab
                        </span>
                      ) : (
                        <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> Menunggu
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight">
                      {t.pertanyaan}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Panel */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm flex flex-col h-[420px] lg:h-[600px] justify-between">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Ticket header */}
              <div className="p-5 border-b border-outline-variant/10 bg-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Detil Obrolan</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedTicket.id}</p>
                </div>
                {selectedTicket.status === 'answered' ? (
                  <span className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full">
                    Selesai Dijawab
                  </span>
                ) : (
                  <span className="bg-yellow-500 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-full">
                    Sedang Diproses
                  </span>
                )}
              </div>

              {/* Chat timeline scroll */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* User Question */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none max-w-md shadow-sm text-xs md:text-sm text-left">
                    {selectedTicket.pertanyaan}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mr-1">
                    Ditanyakan oleh Kamu • {new Date(selectedTicket.ditanyakan_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Admin Reply */}
                {selectedTicket.status === 'answered' ? (
                  <div className="flex flex-col items-start space-y-1">
                    <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none max-w-md shadow-sm text-xs md:text-sm text-left border border-slate-200">
                      {selectedTicket.jawaban}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold ml-1">
                      Dijawab oleh Konselor PENDEKAREMAJA • {selectedTicket.dijawab_at ? new Date(selectedTicket.dijawab_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl text-xs text-yellow-800 max-w-md">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-yellow-600" />
                    <p>
                      Pertanyaan kamu sudah masuk ke antrean konsultasi. Konselor atau dokter kami akan menjawabnya dalam waktu maksimal 24 jam. Terima kasih atas kesabaranmu!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <MessageSquare className="w-16 h-16 text-slate-300 mb-3" />
              <h3 className="font-bold text-base text-slate-700">Pilih Tiket Konsultasi</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Pilih salah satu riwayat pertanyaan di sebelah kiri untuk melihat percakapan, atau kirim pertanyaan baru di bawah.
              </p>
            </div>
          )}

          {/* Bottom Write question Input */}
          <div className="p-4 border-t border-outline-variant/10 bg-slate-50 shrink-0">
            <form onSubmit={handleAsk} className="flex gap-2">
              <input
                type="text"
                placeholder="Tulis pertanyaan rahasiamu disini..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 bg-white border border-outline-variant/20 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors shadow-sm"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !questionText.trim()}
                className="bg-primary hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs p-3 rounded-xl transition-colors shadow-md shadow-primary/20 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
