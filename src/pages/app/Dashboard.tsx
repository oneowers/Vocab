import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import TranslatorPanel from '../../components/TranslatorPanel';
import CardList from '../../components/CardList';
import { Card } from '@prisma/client';
import { Search, Download, Upload, Filter } from 'lucide-react';
import { cn, getTodayStr } from '../../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { session, user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const url = new URL('/api/cards', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (selectedTag) url.searchParams.set('tag', selectedTag);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [search, selectedTag]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  const allTags = Array.from(new Set(cards.flatMap(c => c.tags)));
  const dueToday = cards.filter(c => c.nextReviewDate <= getTodayStr()).length;
  const mastered = cards.filter(c => c.correctCount >= 5).length; // simple logic for mastered

  const handleExport = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'lexiflow-cards.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedCards = JSON.parse(event.target?.result as string);
        for (const card of importedCards) {
          await fetch('/api/cards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              original: card.original,
              translation: card.translation,
              direction: card.direction,
              example: card.example,
              phonetic: card.phonetic,
              tags: card.tags
            })
          });
        }
        fetchCards();
        alert('Cards imported successfully!');
      } catch (err) {
        alert('Failed to import cards. Check JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar: Tools & Stats */}
      <aside className="w-[380px] border-r border-border-subtle bg-bg-light p-8 flex flex-col space-y-8 overflow-y-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-border-subtle p-4 rounded-xl">
            <div className="text-[10px] uppercase tracking-wider text-secondary mb-1 font-bold">Total Cards</div>
            <div className="text-2xl font-bold tracking-tight">{cards.length}</div>
          </div>
          <div className="bg-white border border-border-subtle p-4 rounded-xl">
            <div className="text-[10px] uppercase tracking-wider text-accent-orange mb-1 font-bold">Due Today</div>
            <div className="text-2xl font-bold tracking-tight">{dueToday}</div>
          </div>
        </div>

        {/* Translator Panel */}
        <div className="flex-1">
          <TranslatorPanel onCardAdded={fetchCards} />
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="flex-1 p-8 bg-white flex flex-col overflow-y-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter mb-1">Recent Cards</h1>
            <p className="text-sm text-secondary">Keep track of your latest additions and their mastery.</p>
          </div>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-4 py-2 border border-border-subtle rounded-lg text-xs outline-none focus:border-primary transition-colors"
                />
              </div>
              <button 
                onClick={handleExport}
                className="px-4 py-2 border border-border-subtle rounded-lg text-xs font-bold hover:bg-[#F4F4F5] transition-colors"
                title="Export JSON"
              >
                Export
              </button>
              <label className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center cursor-pointer hover:bg-black transition-all">
                <span className="mr-2">+</span> Import
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
          </div>
        </div>

        {/* Tag Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button 
            onClick={() => setSelectedTag(null)}
            className={cn(
              "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors",
              selectedTag === null ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200"
            )}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={cn(
                "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors",
                selectedTag === tag ? "bg-primary text-white" : "bg-gray-100 text-secondary hover:bg-gray-200"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <CardList cards={cards} onDelete={handleDelete} />
        </div>

        {dueToday > 0 && (
          <div className="mt-8 h-24 bg-primary rounded-2xl p-6 flex items-center justify-between text-white relative overflow-hidden shrink-0">
            <div className="absolute -right-4 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="text-xl font-bold">Ready for a session?</div>
              <div className="text-white/60 text-sm">{dueToday} cards are waiting for review today.</div>
            </div>
            <Link to="/review" className="relative z-10 bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-white/90 transition-all">Start Review</Link>
          </div>
        )}
      </section>
    </div>
  );
}
