import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Card, ReviewLog } from '@prisma/client';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';

export default function Stats() {
  const { session, user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardsRes, reviewsRes] = await Promise.all([
          fetch('/api/cards', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('/api/review/logs', { headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => null)
        ]);
        
        if (cardsRes.ok) setCards(await cardsRes.json());
        if (reviewsRes?.ok) setLogs(await reviewsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return null;

  const totalCards = cards.length;
  const mastered = cards.filter(c => c.correctCount >= 5).length;
  const accuracy = logs.length > 0 ? Math.round((logs.filter(l => l.result === 'known').length / logs.length) * 100) : 0;
  
  const tagsMap: Record<string, number> = {};
  cards.forEach(c => c.tags.forEach(t => tagsMap[t] = (tagsMap[t] || 0) + 1));
  const sortedTags = Object.entries(tagsMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
  const hardestCards = [...cards].sort((a,b) => b.wrongCount - a.wrongCount).slice(0, 5);

  return (
    <div className="h-full flex flex-col p-12 bg-white overflow-y-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">Academic Mastery</h1>
        <p className="text-secondary text-sm">Longitudinal performance analysis and memory retention metrics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Words Mastered', value: mastered, color: 'text-primary' },
          { label: 'Current Streak', value: `${user?.streak} Days`, color: 'text-accent-orange' },
          { label: 'Recall Accuracy', value: `${accuracy}%`, color: 'text-emerald-600' },
          { label: 'Total Deck Size', value: totalCards, color: 'text-blue-600' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="p-6 bg-bg-light border border-border-subtle rounded-2xl"
          >
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mastery Panel */}
        <div className="bg-white border border-border-subtle rounded-[2rem] p-8 space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-widest italic">Learning Velocity</h3>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-secondary">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <span>By Tag</span>
            </div>
          </div>
          <div className="space-y-6 flex-1">
            {sortedTags.map(([tag, count], i) => (
              <div key={tag} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-primary">{tag}</span>
                  <span className="text-secondary">{count} Cards</span>
                </div>
                <div className="h-1.5 bg-bg-light rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(count / totalCards) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Focus Needed Panel */}
        <div className="bg-primary text-white rounded-[2rem] p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-10">
            <Target size={160} />
          </div>
          <div className="relative z-10 w-full">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-6">Focus Needed</p>
            <div className="divide-y divide-white/10 w-full mb-8">
              {hardestCards.filter(c => c.wrongCount > 0).map((card) => (
                <div key={card.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-display font-bold text-white">{card.original}</p>
                    <p className="text-xs text-white/50 italic">{card.translation}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-accent-orange">{card.wrongCount} WRONG</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter italic">Mistake frequency</p>
                  </div>
                </div>
              ))}
              {hardestCards.filter(c => c.wrongCount > 0).length === 0 && (
                <p className="py-8 text-center text-white/30 italic text-sm">Perfect retention detected in system.</p>
              )}
            </div>
            <Link to="/review" className="block w-full text-center bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-black/20">Optimize My Algorithm</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
