import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Users, Languages, Brain, Activity, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    .then(res => res.json())
    .then(setData)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const stats = [
    { label: 'Total Users', value: data?.totals.users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Cards', value: data?.totals.cards, icon: Languages, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Reviews', value: data?.totals.reviews, icon: Brain, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Lifetime Sessions', value: data?.totals.sessions, icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all"
          >
            <div className={cn("p-4 rounded-3xl inline-flex mb-6", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic mb-2">{stat.label}</p>
            <p className="text-4xl font-display font-medium">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Simple Bar Chart for New Users last 30 days */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium tracking-tight">User Growth (Last 30 Days)</h2>
            <select className="bg-gray-50 border-none text-[10px] font-bold uppercase tracking-wider rounded-lg px-3 py-1 outline-none">
              <option>New Users</option>
              <option>Total Reviews</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end gap-1 px-4">
            {data?.dayStats?.slice().reverse().map((day: any, i: number) => {
              const max = Math.max(...data.dayStats.map((d: any) => d.newUsers)) || 1;
              const height = (day.newUsers / max) * 100;
              return (
                <div key={day.date} className="flex-1 group relative">
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: `${Math.max(height, 5)}%` }}
                    className="w-full bg-purple-500 rounded-t-sm group-hover:bg-purple-600 transition-colors" 
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black text-white text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.date}: {day.newUsers} users
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between px-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">
            <span>{data?.dayStats?.[data.dayStats.length-1]?.date}</span>
            <span>Today</span>
          </div>
        </div>

        {/* Recent Activity Feed Placeholder */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-8">
          <h2 className="text-lg font-medium tracking-tight">System Logs</h2>
          <div className="divide-y divide-gray-50">
            {[1,2,3,4,5].map((_, i) => (
              <div key={i} className="py-4 flex gap-4 items-start">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Database backup complete</p>
                  <p className="text-[10px] text-gray-400 font-mono">2h ago · System</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
