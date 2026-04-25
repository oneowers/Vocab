import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Users, LayoutDashboard, BarChart3, Languages, ArrowLeft, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', exact: true, icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Cards', path: '/admin/cards', icon: Languages },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col hidden md:flex">
        <div className="p-8 pb-12">
          <Link to="/dashboard" className="text-2xl font-display font-medium tracking-tight text-purple-600">LexiFlow Admin</Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  active 
                    ? "bg-purple-50 text-purple-600 shadow-sm" 
                    : "text-gray-400 hover:text-black hover:bg-gray-50"
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-black hover:bg-gray-50 mb-2">
            <ArrowLeft size={18} />
            Back to App
          </Link>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 shrink-0">
          <h1 className="text-sm font-bold uppercase tracking-widest text-gray-400 italic">
            Admin Panel / {navItems.find(i => location.pathname === i.path || location.pathname.startsWith(i.path))?.name}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold">{user?.name}</p>
              <p className="text-[10px] text-purple-500 font-bold uppercase">Administrator</p>
            </div>
            <img src={user?.avatarUrl || ''} className="w-8 h-8 rounded-full" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
