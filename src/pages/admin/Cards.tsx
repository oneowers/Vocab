import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Search, Trash2, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Cards() {
  const [cards, setCards] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { session } = useAuth();

  const fetchCards = async () => {
    // We need an endpoint for this - using GET /api/cards but we'd need one that returns ALL users' cards
    // For now assuming the standard one for the current user and maybe an admin one later
    try {
      // In a real app we'd have /api/admin/cards
      const res = await fetch('/api/cards', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) setCards(await res.json());
    } catch (err) {}
  };

  useEffect(() => { fetchCards(); }, []);

  const filteredCards = cards.filter(c => 
    c.original.toLowerCase().includes(search.toLowerCase()) || 
    c.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all cards..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:border-purple-300 outline-none transition-all text-sm shadow-sm"
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-300 italic">
              <th className="px-8 py-6">Original</th>
              <th className="px-8 py-6">Translation</th>
              <th className="px-8 py-6">User</th>
              <th className="px-8 py-6">Created</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredCards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-6 font-bold text-sm">{card.original}</td>
                <td className="px-8 py-6 text-sm text-gray-600">{card.translation}</td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                    <User size={12} />
                    <span>User Mode (Admin list pending)</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-[10px] font-mono text-gray-400">
                  {new Date(card.dateAdded).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
