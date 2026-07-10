import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Consultation } from '../../services/api';
import { Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

export default function AdminConsultation() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Consultation | null>(null);
  const [replyText, setReplyText] = useState('');
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
        const updated = list.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Error loading consultations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.answerQuestion(selectedTicket.id, replyText);
      setReplyText('');
      await loadTickets();
    } catch (err) {
      console.error('Error answering ticket:', err);
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
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-slate-800">Konsultasi Remaja</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar pertanyaan masuk dari remaja. Pastikan menjawab dengan bahasa yang ramah, akurat, dan mendidik.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Ticket List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px] shrink-0">
          <div className="flex border-b border-slate-200 text-center font-bold text-[10px] text-slate-500 bg-slate-50">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 transition-colors ${activeTab === 'all' ? 'bg-white border-b-2 border-red-600 text-red-600' : 'hover:bg-slate-100'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 transition-colors ${activeTab === 'pending' ? 'bg-white border-b-2 border-red-600 text-red-600' : 'hover:bg-slate-100'}`}
            >
              Masuk ({consultations.filter(c => c.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('answered')}
              className={`flex-1 py-3 transition-colors ${activeTab === 'answered' ? 'bg-white border-b-2 border-red-600 text-red-600' : 'hover:bg-slate-100'}`}
            >
              Dijawab ({consultations.filter(c => c.status === 'answered').length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">Tidak ada tiket.</p>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected ? 'bg-red-500/5 border-l-4 border-red-600' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[9px] text-slate-700 uppercase">
                        {t.user_name || 'Remaja'}
                      </span>
                      {t.status === 'answered' ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 fill-current" /> Terjawab
                        </span>
                      ) : (
                        <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 font-bold">
                          <Clock className="w-2.5 h-2.5" /> Pending
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

        {/* Right Side: Consultation Panel */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px] justify-between">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Header details */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Tiket Pertanyaan</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Pengirim: {selectedTicket.user_name || 'Remaja'}</p>
                </div>
                <span className="text-[9px] text-slate-400 font-bold">
                  {new Date(selectedTicket.ditanyakan_at).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Message scroll */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* User message block */}
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase ml-1">
                    Tanya ({selectedTicket.user_name || 'Remaja'}):
                  </span>
                  <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none max-w-md shadow-sm text-xs md:text-sm text-left border border-slate-200">
                    {selectedTicket.pertanyaan}
                  </div>
                </div>

                {/* Reply display */}
                {selectedTicket.status === 'answered' && (
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-[9px] font-bold text-red-600 uppercase mr-1">
                      Jawaban Anda (Admin):
                    </span>
                    <div className="bg-red-600 text-white p-4 rounded-2xl rounded-tr-none max-w-md shadow-sm text-xs md:text-sm text-left">
                      {selectedTicket.jawaban}
                    </div>
                    {selectedTicket.dijawab_at && (
                      <span className="text-[8px] text-slate-400 font-bold">
                        Waktu Jawab: {new Date(selectedTicket.dijawab_at).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Response input drawer */}
              {selectedTicket.status === 'pending' && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                  <form onSubmit={handleReplySubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ketik jawaban konsultasi rujukan di sini..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-600 transition-colors shadow-sm"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !replyText.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs p-3 rounded-xl transition-colors shadow-md flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <MessageSquare className="w-16 h-16 text-slate-300 mb-3" />
              <h3 className="font-bold text-base text-slate-700">Pilih Tiket Konsultasi</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">Pilih salah satu tiket obrolan dari daftar sebelah kiri untuk membalas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
