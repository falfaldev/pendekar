import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import type { Profile } from './services/api';

// Authentication Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Layout Wrappers
import UserLayout from './components/UserLayout';
import AdminLayout from './components/AdminLayout';

// User Views
import Dashboard from './pages/Dashboard';
import MateriList from './pages/MateriList';
import MateriDetail from './pages/MateriDetail';
import QuizList from './pages/QuizList';
import QuizActive from './pages/QuizActive';
import GameList from './pages/GameList';
import Leaderboard from './pages/Leaderboard';
import Konsultasi from './pages/Konsultasi';
import LayananInfo from './pages/LayananInfo';
import ProfilePage from './pages/Profile';
import Landing from './pages/Landing';

// Games Pages
import BenarSalah from './pages/games/BenarSalah';
import MemoryCard from './pages/games/MemoryCard';
import DragDrop from './pages/games/DragDrop';
import TebakGambar from './pages/games/TebakGambar';
import PuzzleEdukasi from './pages/games/PuzzleEdukasi';

// Admin Views
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageMateri from './pages/admin/ManageMateri';
import ManageQuiz from './pages/admin/ManageQuiz';
import ManageLayanan from './pages/admin/ManageLayanan';
import AdminConsultation from './pages/admin/AdminConsultation';

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const p = await api.getCurrentProfile();
      setUser(p);
    } catch (e) {
      console.error(e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleProfileUpdated = () => {
      void fetchProfile();
    };

    window.addEventListener('pendekar-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('pendekar-profile-updated', handleProfileUpdated);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<Landing user={user} onLogout={handleLogout} />} 
        />

        {/* Authentication Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={fetchProfile} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" replace /> : <Register onLoginSuccess={fetchProfile} />} 
        />

        {/* User Protected Routes */}
        <Route
          path="/*"
          element={
            user ? (
              user.role === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <UserLayout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/materi" element={<MateriList />} />
                    <Route path="/materi/:slug" element={<MateriDetail />} />
                    <Route path="/quiz" element={<QuizList />} />
                    <Route path="/quiz/:id" element={<QuizActive />} />
                    <Route path="/game" element={<GameList />} />
                    
                    {/* Game-specific launchers */}
                    <Route path="/game/benar_salah/:id" element={<BenarSalah />} />
                    <Route path="/game/memory/:id" element={<MemoryCard />} />
                    <Route path="/game/drag_drop/:id" element={<DragDrop />} />
                    <Route path="/game/tebak_gambar/:id" element={<TebakGambar />} />
                    <Route path="/game/puzzle/:id" element={<PuzzleEdukasi />} />

                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/konsultasi" element={<Konsultasi />} />
                    <Route path="/layanan" element={<LayananInfo />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </UserLayout>
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/*"
          element={
            user && user.role === 'admin' ? (
              <AdminLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/users" element={<ManageUsers />} />
                  <Route path="/materi" element={<ManageMateri />} />
                  <Route path="/quiz" element={<ManageQuiz />} />
                  <Route path="/layanan" element={<ManageLayanan />} />
                  <Route path="/konsultasi" element={<AdminConsultation />} />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </AdminLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}
