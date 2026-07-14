import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, ShieldAlert } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setIsLoading(true);
    try {
      const user = await api.login(email, password);
      onLoginSuccess();
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-indigo-600 to-secondary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background light blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/20 relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto flex items-center justify-center mb-4">
            <img src="/logo-pendekar.svg" alt="Logo PENDEKAR" className="w-20 h-20 object-contain drop-shadow-lg" />
          </div>
          <h1 className="font-headline-lg text-2xl font-extrabold text-primary leading-none">PENDEKAREMAJA</h1>
          <p className="text-on-surface-variant text-xs mt-2 uppercase tracking-widest font-bold">
            Pelayanan Edukasi dan Kesehatan Reproduksi Remaja
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-error-container/30 border border-error/20 text-error rounded-xl p-4 flex items-center gap-3 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Contoh: andi@pendekar.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container/50 border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk ke Platform
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-on-surface-variant">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Daftar Sekarang
          </Link>
        </div>

      </div>
    </div>
  );
}
