import { Volume2, Trash2 } from 'lucide-react';
import { speak } from '../lib/tts';
import { cn, getTodayStr } from '../lib/utils';
import { Card } from '@prisma/client';

export default function CardList({ cards, onDelete }: { cards: Card[], onDelete: (id: string) => void }) {
  if (cards.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 font-medium italic">
        No cards found. Start by adding one!
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-12 px-4 py-3 text-[10px] uppercase font-bold tracking-widest text-[#A1A1AA] border-b border-border-subtle">
        <div className="col-span-5">Word & Translation</div>
        <div className="col-span-3 text-center">Tags</div>
        <div className="col-span-2 text-center">Mastery</div>
        <div className="col-span-2 text-right">Next Review</div>
      </div>
      
      <div className="flex-1">
        {cards.map((card) => {
          const mastery = Math.min((card.correctCount / 5) * 100, 100);
          const isDue = card.nextReviewDate <= getTodayStr();

          return (
            <div key={card.id} className="grid grid-cols-12 px-4 py-5 border-b border-[#F4F4F5] items-center hover:bg-bg-light group transition-colors">
              <div className="col-span-5 flex flex-col relative">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-primary">{card.original}</span>
                  <button 
                    onClick={() => speak(card.original, card.direction.startsWith('en') ? 'en-US' : 'ru-RU')}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-primary transition-all"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
                <div className="text-sm text-secondary">{card.translation}</div>
              </div>
              <div className="col-span-3 flex justify-center flex-wrap gap-1">
                {card.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-[#F1F5F9] text-[10px] font-medium rounded text-[#475569]">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="col-span-2 flex justify-center px-4">
                <div className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      mastery >= 100 ? "bg-blue-500" : mastery > 50 ? "bg-emerald-500" : "bg-orange-500"
                    )} 
                    style={{ width: `${Math.max(mastery, 5)}%` }} 
                  />
                </div>
              </div>
              <div className="col-span-2 text-right flex items-center justify-end gap-3">
                <div className="flex flex-col items-end">
                  {isDue ? (
                    <div className="text-xs font-bold text-red-600">Due Now</div>
                  ) : (
                    <div className="text-xs font-medium text-primary">{card.nextReviewDate}</div>
                  )}
                  <div className="text-[10px] text-[#A1A1AA] uppercase tracking-tighter">
                    {mastery >= 100 ? 'Mastered' : 'Learning'}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(card.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
