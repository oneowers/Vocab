import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LogOut, LayoutDashboard, Brain, BarChart3, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Review', path: '/review' },
    { name: 'Stats', path: '/stats' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col select-none">
      <nav className="h-16 border-b border-border-subtle px-8 flex items-center justify-between sticky top-0 bg-white z-50">
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs italic">V</span>
            </div>
            <span className="font-bold tracking-tight text-lg uppercase">LexiFlow</span>
          </Link>
          <div className="hidden md:flex space-x-6 text-sm font-medium text-secondary">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "py-5 transition-colors border-b-2 hover:text-primary",
                  location.pathname.startsWith(item.path) ? "text-primary border-primary" : "border-transparent"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-[#F4F4F5] px-3 py-1.5 rounded-full">
            <span className="text-orange-600 mr-1.5">🔥</span>
            <span className="text-sm font-bold">{user?.streak} Day Streak</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-border-subtle border border-[#D1D1D1] overflow-hidden">
            <img src={user?.avatarUrl || ''} className="w-full h-full object-cover" />
          </div>
          <button onClick={handleSignOut} className="text-secondary hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      <footer className="h-8 border-t border-border-subtle bg-white px-8 flex items-center justify-between text-[10px] text-[#A1A1AA] uppercase tracking-widest font-bold">
        <div className="flex space-x-6">
          <span>Database: Connected</span>
          <span>Sync: Live</span>
        </div>
        <div className="flex space-x-6">
          <span>{user?.role === 'ADMIN' ? <Link to="/admin" className="text-primary hover:underline">Admin Panel</Link> : 'User Mode'}</span>
          <span className="text-primary tracking-normal uppercase">v1.2.0</span>
        </div>
      </footer>
    </div>
  );
}
