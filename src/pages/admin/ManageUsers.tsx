import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Profile } from '../../services/api';
import { Users, Trash2, ArrowLeftRight } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await api.getAllUsers();
      setUsers(list);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'user' | 'admin') => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirm = window.confirm(`Apakah Anda yakin ingin mengubah peran pengguna ini menjadi ${nextRole.toUpperCase()}?`);
    if (!confirm) return;

    try {
      await api.updateUserRole(userId, nextRole);
      loadUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
    }
  };

  const handleDelete = async (userId: string) => {
    const confirm = window.confirm('Apakah Anda yakin ingin menghapus akun ini secara permanen? Tindakan ini tidak bisa dibatalkan.');
    if (!confirm) return;

    try {
      await api.deleteUser(userId);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
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
      <div>
        <h1 className="font-headline-md text-2xl font-bold text-slate-800">Kelola Pengguna</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar pengguna terdaftar di platform PENDEKAR. Anda dapat menaikkan peran atau menghapus akun.</p>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Total Akun ({users.length})
          </h3>
        </div>

        {/* Mobile card list */}
        <div className="block sm:hidden divide-y divide-slate-200">
          {users.map((u) => (
            <div key={u.id} className="px-4 py-4 flex items-center gap-3">
              <img src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                alt={u.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-800 truncate">{u.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span>
                  <span className="text-[10px] text-slate-500">Lvl {u.level} · {u.points} Pts</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleToggleRole(u.id, u.role)}
                  className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:border-red-500 hover:text-red-500 transition-colors bg-white min-w-[40px] min-h-[40px] flex items-center justify-center">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(u.id)}
                  className="p-2.5 border border-slate-200 rounded-xl text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors bg-white min-w-[40px] min-h-[40px] flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Umur</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Peran</th>
                <th className="px-6 py-4 text-center">XP / Level</th>
                <th className="px-6 py-4 text-center">Poin</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    />
                    <span className="font-bold text-slate-800">{u.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{u.age} Tahun</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{u.gender || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    Lvl {u.level} • {u.xp} XP
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">
                    {u.points}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      title="Ubah Peran"
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-500 hover:text-red-500 transition-colors shadow-sm bg-white"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      title="Hapus Akun"
                      className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-red-600 hover:text-white hover:bg-red-600 transition-colors shadow-sm bg-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>{/* end hidden sm:block */}
      </div>
    </div>
  );
}
