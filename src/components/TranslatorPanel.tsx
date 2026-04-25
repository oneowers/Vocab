import { useState } from 'react';
import { translateText } from '../lib/translation';
import { speak } from '../lib/tts';
import { Volume2, Languages, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';

export default function TranslatorPanel({ onCardAdded }: { onCardAdded: () => void }) {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [direction, setDirection] = useState<'en-ru' | 'ru-en'>('en-ru');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [tags, setTags] = useState('');

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const from = direction === 'en-ru' ? 'en' : 'ru';
      const to = direction === 'en-ru' ? 'ru' : 'en';
      const res = await translateText(text, from, to);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!result) return;
    setAdding(true);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          original: text,
          translation: result.translatedText,
          direction,
          example: result.example,
          phonetic: result.phonetic,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        setText('');
        setResult(null);
        setTags('');
        onCardAdded();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm uppercase tracking-tight">Translator</h3>
        <div className="flex bg-white border border-border-subtle rounded p-0.5">
          <button 
            onClick={() => setDirection('en-ru')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-sm transition-colors",
              direction === 'en-ru' ? "bg-primary text-white" : "text-secondary"
            )}
          >
            EN-RU
          </button>
          <button 
            onClick={() => setDirection('ru-en')}
            className={cn(
              "px-3 py-1 text-[10px] font-bold rounded-sm transition-colors",
              direction === 'ru-en' ? "bg-primary text-white" : "text-secondary"
            )}
          >
            RU-EN
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-28 bg-white border border-border-subtle rounded-xl p-4 text-sm focus:outline-none focus:border-primary resize-none transition-colors"
            placeholder="Type a word to translate..."
          />
          <button 
            onClick={() => speak(text, direction === 'en-ru' ? 'en-US' : 'ru-RU')}
            className="absolute bottom-3 right-3 text-gray-300 hover:text-primary transition-colors"
          >
            🔊
          </button>
        </div>

        {result && (
          <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xl font-bold text-[#334155] font-display">{result.translatedText}</span>
              <button 
                onClick={() => speak(result.translatedText, direction === 'en-ru' ? 'ru-RU' : 'en-US')}
                className="text-[#94A3B8] hover:text-primary transition-colors"
              >
                🔊
              </button>
            </div>
            {result.phonetic && (
              <div className="text-[11px] font-mono text-[#64748B] mb-3">/ {result.phonetic} /</div>
            )}
            {result.example && (
              <p className="text-xs text-[#475569] italic leading-relaxed">"{result.example}"</p>
            )}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-white border border-border-subtle rounded-lg px-4 py-2 text-xs focus:ring-0 focus:border-primary outline-none transition-colors" 
            placeholder="Add tags (comma separated)..."
          />
          <button 
            onClick={handleAddCard}
            disabled={adding || !result}
            className="w-full bg-primary text-white font-bold py-3 rounded-lg text-sm shadow-lg shadow-black/5 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add to Deck'}
          </button>
        </div>
      </div>
    </div>
  );
}
