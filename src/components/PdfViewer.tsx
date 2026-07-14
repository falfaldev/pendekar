import { useState } from 'react';
import { Download, X, Maximize2, ExternalLink, RefreshCw, FileText } from 'lucide-react';

interface PdfViewerProps {
  url: string;
  fileName?: string;
  onClose?: () => void;
}

export default function PdfViewer({ url, fileName = 'dokumen.pdf', onClose }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mode, setMode] = useState<'google' | 'direct'>('google');

  // Google Docs Viewer — bisa baca URL publik tanpa CORS
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Force reload iframe dengan key baru
    setMode(m => m === 'google' ? 'direct' : 'google');
    setTimeout(() => setMode(m => m === 'google' ? 'direct' : 'google'), 100);
  };

  const iframeSrc = mode === 'google' ? googleViewerUrl : url;

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-2xl overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0 gap-2">
        {/* Nama file */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-[9px] font-extrabold">PDF</span>
          </div>
          <span className="text-white text-xs font-medium truncate">
            {fileName}
          </span>
        </div>

        {/* Kontrol kanan */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mode switch */}
          <button
            onClick={() => { setIsLoading(true); setHasError(false); setMode(m => m === 'google' ? 'direct' : 'google'); }}
            className="px-2.5 py-1.5 text-slate-300 hover:text-white text-[10px] font-bold hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            title="Ganti mode tampilan"
          >
            {mode === 'google' ? 'Mode: Google' : 'Mode: Direct'}
          </button>

          <div className="w-px h-5 bg-slate-600 mx-0.5" />

          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Muat ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.open(url, '_blank', 'noreferrer')}
            className="p-1.5 text-slate-300 hover:text-sky-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Buka di tab baru"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Unduh PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 relative bg-slate-700 overflow-hidden">
        {/* Loading overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-slate-700">
            <div className="w-12 h-12 border-4 border-slate-500 border-t-white rounded-full animate-spin" />
            <p className="text-slate-300 text-sm font-medium">Memuat dokumen...</p>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10 bg-slate-700 p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold">Tidak dapat menampilkan PDF</p>
              <p className="text-slate-400 text-sm mt-1">Coba salah satu opsi di bawah</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={() => { setHasError(false); setIsLoading(true); setMode('google'); }}
                className="bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                Coba Google Viewer
              </button>
              <button
                onClick={() => window.open(url, '_blank', 'noreferrer')}
                className="bg-slate-600 hover:bg-slate-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Buka di Tab Baru
              </button>
              <button
                onClick={handleDownload}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Unduh PDF
              </button>
            </div>
          </div>
        )}

        {/* iframe — Google Docs Viewer atau direct URL */}
        <iframe
          key={`${mode}-${url}`}
          src={iframeSrc}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            if (mode === 'google') {
              // Fallback otomatis ke mode direct
              setMode('direct');
              setIsLoading(true);
            } else {
              setHasError(true);
            }
          }}
        />
      </div>
    </div>
  );
}

// Modal wrapper
export function PdfViewerModal({
  url,
  fileName,
  isOpen,
  onClose,
}: {
  url: string;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-white">
            <Maximize2 className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-bold">Baca Materi PDF</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden rounded-2xl">
          <PdfViewer url={url} fileName={fileName} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
