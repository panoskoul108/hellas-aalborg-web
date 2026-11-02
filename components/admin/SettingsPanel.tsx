'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../app/supabase';

export default function SettingsPanel() {
  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    const { data } = await supabase.from('store_hours').select('*').order('day_of_week', { ascending: true });
    if (data) setHours(data);
    setLoading(false);
  };

  const handleUpdate = async (day_of_week: number, field: string, value: any) => {
    // Ενημερώνουμε άμεσα την οθόνη (Optimistic UI)
    const updatedHours = hours.map(h => h.day_of_week === day_of_week ? { ...h, [field]: value } : h);
    setHours(updatedHours);
    
    // Ενημερώνουμε τη βάση
    await supabase.from('store_hours').update({ [field]: value }).eq('day_of_week', day_of_week);
  };

  if (loading) return <div className="text-center text-[#38BDF8] animate-pulse py-10 font-bold">Φόρτωση Ρυθμίσεων...</div>;

  return (
    <div className="bg-[#0F172A]/80 border border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto backdrop-blur-md">
      <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
        <span>🕒</span> Ωράριο Λειτουργίας & Έκτακτο Κλείσιμο
      </h2>
      
      <div className="flex flex-col gap-4">
        {hours.map(day => (
          <div key={day.day_of_week} className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-2xl border transition-colors ${day.is_closed ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-800/50 border-white/5'}`}>
            <div className="w-full md:w-32 font-black text-white uppercase text-lg mb-4 md:mb-0">
              {day.day_name}
            </div>
            
            <div className="flex items-center gap-4 flex-1 justify-center mb-4 md:mb-0">
              <input 
                type="time" 
                value={day.open_time.slice(0, 5)} 
                onChange={(e) => handleUpdate(day.day_of_week, 'open_time', e.target.value + ':00')} 
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-[#38BDF8] font-bold text-lg w-32 text-center" 
                disabled={day.is_closed} 
              />
              <span className="text-gray-500 font-bold">-</span>
              <input 
                type="time" 
                value={day.close_time.slice(0, 5)} 
                onChange={(e) => handleUpdate(day.day_of_week, 'close_time', e.target.value + ':00')} 
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-[#38BDF8] font-bold text-lg w-32 text-center" 
                disabled={day.is_closed} 
              />
            </div>
            
            <div className="w-full md:w-40 flex justify-center md:justify-end">
              <button 
                onClick={() => handleUpdate(day.day_of_week, 'is_closed', !day.is_closed)}
                className={`w-full md:w-auto px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-colors shadow-md ${day.is_closed ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-emerald-500 text-[#0B1120] hover:bg-emerald-400'}`}
              >
                {day.is_closed ? 'ΚΛΕΙΣΤΑ' : 'ΑΝΟΙΧΤΑ'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-gray-400 text-sm mt-8 text-center bg-slate-800/50 p-4 rounded-xl border border-white/5">
        💡 <strong className="text-white">Tip:</strong> Οι αλλαγές που κάνετε εδώ αποθηκεύονται αυτόματα και ενημερώνουν αμέσως το site. Αν βάλετε μια μέρα "ΚΛΕΙΣΤΑ", το καλάθι στο site θα κλειδώσει αμέσως.
      </p>
    </div>
  );
}
