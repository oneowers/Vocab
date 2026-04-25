import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Card } from '@prisma/client';
import { getTodayStr } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Play, CheckCircle2, ChevronRight, Volume2, XCircle } from 'lucide-react';
import ReviewSession from '../../components/ReviewSession';

export default function Review() {
  const { session } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<'flip' | 'write' | 'quiz'>('flip');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/cards', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter cards due for today or earlier
        setCards(data.filter((c: Card) => c.nextReviewDate <= getTodayStr()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCards = selectedTag ? cards.filter(c => c.tags.includes(selectedTag)) : cards;
  const allTags = Array.from(new Set(cards.flatMap(c => c.tags)));

  if (loading) return null;

  if (started) {
    return <ReviewSession cards={filteredCards} mode={mode} onComplete={() => { setStarted(false); fetchCards(); }} />;
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl mb-4">
          <Brain size={32} />
        </div>
        <h1 className="text-4xl font-display font-medium tracking-tight">Daily Review</h1>
        <p className="text-gray-400 font-medium italic">You have {cards.length} cards to review today.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-8 shadow-sm">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 italic">Select Mode</p>
          <div className="grid grid-cols-3 gap-4">
            {(['flip', 'write', 'quiz'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                  mode === m 
                    ? "border-black bg-black text-white" 
                    : "border-gray-50 text-gray-400 hover:border-gray-200 hover:text-black hover:bg-gray-50"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest">{m}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 italic">Filter by Tag</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                selectedTag === null ? "bg-black text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  selectedTag === tag ? "bg-black text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={filteredCards.length === 0}
          onClick={() => setStarted(true)}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all hover:bg-orange-600 disabled:opacity-30"
        >
          <Play size={18} fill="currentColor" />
          Start Session ({filteredCards.length} Cards)
        </button>
      </div>
    </div>
  );
}
