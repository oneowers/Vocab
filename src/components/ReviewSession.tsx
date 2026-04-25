import { useState, useEffect } from 'react';
import { Card } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Check, X, ArrowRight, Home, Flame } from 'lucide-react';
import { speak } from '../lib/tts';
import { addDays, getTodayStr, cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export default function ReviewSession({ cards, mode, onComplete }: { cards: Card[], mode: 'flip' | 'write' | 'quiz', onComplete: () => void }) {
  const { session } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [results, setResults] = useState<{ cardId: string, result: 'known' | 'unknown' }[]>([]);
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);

  const currentCard = cards[currentIndex];

  const handleResult = async (result: 'known' | 'unknown') => {
    const nextReviewDate = result === 'known' ? addDays(getTodayStr(), 15) : addDays(getTodayStr(), 1);
    const newCorrect = result === 'known' ? currentCard.correctCount + 1 : currentCard.correctCount;
    const newWrong = result === 'unknown' ? currentCard.wrongCount + 1 : currentCard.wrongCount;

    // Update locally
    const log = { cardId: currentCard.id, result };
    const newResults = [...results, log];
    setResults(newResults);

    // Call API
    try {
      await fetch(`/api/cards/${currentCard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          nextReviewDate,
          reviewCount: currentCard.reviewCount + 1,
          correctCount: newCorrect,
          wrongCount: newWrong
        })
      });

      await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(log)
      });
    } catch (err) {
      console.error(err);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
      setInputValue('');
      setFeedback(null);
    } else {
      setFinished(true);
      // Get final streak
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      setStreak(data.streak);
    }
  };

  const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[a.length][b.length];
  };

  const checkWrite = () => {
    const normalizedInput = inputValue.trim().toLowerCase();
    const normalizedTranslation = currentCard.translation.toLowerCase();
    const distance = getLevenshteinDistance(normalizedInput, normalizedTranslation);
    
    if (distance <= 2) {
      setFeedback('correct');
      setTimeout(() => handleResult('known'), 1500);
    } else {
      setFeedback('wrong');
      setTimeout(() => handleResult('unknown'), 2000);
    }
  };

  if (finished) {
    const correctItems = results.filter(r => r.result === 'known').length;
    const accuracy = Math.round((correctItems / results.length) * 100);

    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-8">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="text-4xl font-display mb-2">Session Complete!</h2>
          <p className="text-gray-400 font-medium italic">You're getting better every day.</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-green-50 rounded-3xl">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Correct</p>
            <p className="text-3xl font-display text-green-700">{correctItems}</p>
          </div>
          <div className="p-6 bg-red-50 rounded-3xl">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Wrong</p>
            <p className="text-3xl font-display text-red-700">{results.length - correctItems}</p>
          </div>
        </div>

        <div className="p-8 bg-black text-white rounded-3xl space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">ACCURACY</p>
          <p className="text-6xl font-display">{accuracy}%</p>
          {streak && (
            <p className="flex items-center justify-center gap-2 text-orange-400 font-bold mt-4 animate-bounce">
              <Flame size={20} fill="currentColor" />
              🔥 Streak: {streak} days!
            </p>
          )}
        </div>

        <button 
          onClick={onComplete}
          className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-semibold transition-all"
        >
          <Home size={18} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-12">
      {/* Progress */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <p className="text-[11px] font-bold text-gray-400 italic">CARD {currentIndex + 1} OF {cards.length}</p>
          <p className="text-[11px] font-mono font-bold text-black">{Math.round(progress)}%</p>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-black" />
        </div>
      </div>

      {/* Card Stage */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="w-full"
          >
            {mode === 'flip' && (
              <div 
                onClick={() => !showBack && setShowBack(true)}
                className={cn(
                  "w-full aspect-[4/3] bg-white border border-border-subtle rounded-[2.5rem] shadow-2xl shadow-black/5 flex flex-col items-center justify-center p-12 text-center transition-all cursor-pointer",
                  !showBack && "hover:scale-[1.01] hover:border-primary"
                )}
              >
                {!showBack ? (
                  <>
                    <h3 className="text-7xl font-display font-medium mb-8 leading-tight">{currentCard.original}</h3>
                    <button 
                      onClick={(e) => { e.stopPropagation(); speak(currentCard.original, currentCard.direction.startsWith('en') ? 'en-US' : 'ru-RU'); }}
                      className="p-4 bg-bg-light text-secondary rounded-xl hover:bg-border-subtle hover:text-primary transition-colors"
                    >
                      <Volume2 size={24} />
                    </button>
                    <p className="mt-12 text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Action: Tap to Reveal</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-5xl font-display font-bold mb-4 text-primary leading-tight underline decoration-border-subtle underline-offset-8">{currentCard.translation}</h3>
                    {currentCard.phonetic && <p className="text-secondary font-mono text-xs mb-4 italic">/ {currentCard.phonetic} /</p>}
                    {currentCard.example && <p className="text-secondary italic max-w-sm text-sm leading-relaxed">"{currentCard.example}"</p>}
                    
                    <div className="grid grid-cols-2 gap-4 w-full mt-12 max-w-sm">
                      <button onClick={() => handleResult('unknown')} className="py-4 bg-[#FAFAFA] border border-border-subtle text-primary rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95">
                        <X size={20} />
                        <span className="text-[10px] uppercase tracking-widest">Incorrect</span>
                      </button>
                      <button onClick={() => handleResult('known')} className="py-4 bg-primary text-white rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95">
                        <Check size={20} />
                        <span className="text-[10px] uppercase tracking-widest">Mastered</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {mode === 'write' && (
              <div className="bg-white border border-border-subtle rounded-[2.5rem] shadow-2xl shadow-black/5 p-16 text-center space-y-12">
                <h3 className="text-6xl font-display font-medium">{currentCard.original}</h3>
                <div className="relative max-w-sm mx-auto">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={!!feedback}
                    placeholder="Provide translation..."
                    className={cn(
                      "w-full text-3xl font-display text-center py-4 border-b-2 outline-none transition-all",
                      feedback === 'correct' && "border-emerald-500 text-emerald-600",
                      feedback === 'wrong' && "border-red-500 text-red-600",
                      !feedback && "border-border-subtle focus:border-primary"
                    )}
                    onKeyDown={(e) => e.key === 'Enter' && checkWrite()}
                    autoFocus
                  />
                  {feedback === 'wrong' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm font-bold text-secondary uppercase tracking-wider italic">
                      Verify: <span className="text-primary not-italic">{currentCard.translation}</span>
                    </motion.p>
                  )}
                </div>
                {!feedback && (
                  <button onClick={checkWrite} className="px-12 py-4 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black shadow-lg shadow-black/5 active:scale-95 transition-all">Submit Solution</button>
                )}
              </div>
            )}

            {/* Quiz mode logic could be added here similarly */}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
