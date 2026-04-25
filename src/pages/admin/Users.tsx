import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Trash2, Shield, ShieldOff, Search, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Users() {
  const { session } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ role: newRole })
    });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this user? All their data will be wiped.')) return;
    
    await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    fetchUsers();
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:border-purple-300 outline-none transition-all text-sm shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-all shadow-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-300 italic">
              <th className="px-8 py-6">User</th>
              <th className="px-8 py-6">Role</th>
              <th className="px-8 py-6">Stats</th>
              <th className="px-8 py-6">Streak</th>
              <th className="px-8 py-6">Last Active</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full border border-gray-100" />
                    <div>
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider",
                    user.role === 'ADMIN' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold">{user._count.cards} Cards</p>
                    <p className="text-[10px] text-gray-400 italic">{user._count.reviewLogs} Reviews</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-sm font-mono font-bold">🔥 {user.streak}</span>
                </td>
                <td className="px-8 py-6">
                  <p className="text-[11px] text-gray-400 font-mono uppercase tracking-tighter">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                  </p>
                </td>
                <td className="px-8 py-6 text-right space-x-2">
                  <button 
                    onClick={() => toggleRole(user.id, user.role)}
                    className="p-2 text-gray-300 hover:text-purple-600 transition-colors"
                    title={user.role === 'ADMIN' ? "Demote to User" : "Promote to Admin"}
                  >
                    {user.role === 'ADMIN' ? <ShieldOff size={18} /> : <Shield size={18} />}
                  </button>
                  <button 
                    onClick={() => deleteUser(user.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-400 italic">No users found.</div>
        )}
      </div>
    </div>
  );
}
