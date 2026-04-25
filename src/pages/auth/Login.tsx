import { useAuth } from '../../lib/AuthContext';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signInWithGoogle, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white p-6 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full space-y-12"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl italic">V</span>
            </div>
            <span className="font-bold tracking-tighter text-3xl uppercase">LexiFlow</span>
          </div>
          <h1 className="text-5xl font-display font-medium tracking-tighter leading-none">Elevate your vocabulary.</h1>
          <p className="text-secondary text-sm font-medium leading-relaxed">A minimal, high-performance space for mastering new words through geometric discipline.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-primary text-white rounded-xl font-bold transition-all hover:bg-black shadow-xl shadow-black/10 active:scale-[0.98]"
          >
            <LogIn size={20} />
            Continue with Google
          </button>
          <div className="flex items-center justify-center space-x-4 pt-4">
            <div className="h-[1px] flex-1 bg-border-subtle" />
            <span className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest italic">Authenticity Required</span>
            <div className="h-[1px] flex-1 bg-border-subtle" />
          </div>
        </div>

        <p className="text-[10px] text-[#D1D1D1] font-mono text-center uppercase tracking-widest">System Operational · Spark 2.0</p>
      </motion.div>
    </div>
  );
}
