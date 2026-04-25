import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { motion } from 'motion/react';
import { TrendingUp, Users, Languages, Brain } from 'lucide-react';

export default function Analytics() {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/analytics', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    .then(res => res.json())
    .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* New Cards Bar Chart */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><Languages size={20} /></div>
            <h2 className="text-xl font-medium">New Cards Created</h2>
          </div>
          <div className="h-48 flex items-end gap-2">
            {data.dayStats?.map((day: any) => (
              <div key={day.date} className="flex-1 bg-blue-100 rounded-t-lg relative group h-full flex flex-col justify-end">
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: `${(day.newCards / (Math.max(...data.dayStats.map((d: any) => d.newCards)) || 1)) * 100}%` }}
                  className="w-full bg-blue-500 rounded-t-lg"
                />
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black text-white text-[9px] p-1 rounded transition-opacity">
                  {day.newCards}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Reviews Bar Chart */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Brain size={20} /></div>
            <h2 className="text-xl font-medium">Total Reviews</h2>
          </div>
          <div className="h-48 flex items-end gap-2">
            {data.dayStats?.map((day: any) => (
              <div key={day.date} className="flex-1 bg-orange-100 rounded-t-lg relative group h-full flex flex-col justify-end">
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: `${(day.totalReviews / (Math.max(...data.dayStats.map((d: any) => d.totalReviews)) || 1)) * 100}%` }}
                  className="w-full bg-orange-500 rounded-t-lg"
                />
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black text-white text-[9px] p-1 rounded transition-opacity">
                  {day.totalReviews}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-12 text-center text-gray-400 italic font-medium">
        Advanced data models and prediction forecasts coming soon...
      </div>
    </div>
  );
}
