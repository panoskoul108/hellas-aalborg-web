'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/supabase'; // Βεβαιώσου ότι το path είναι σωστό για το project σου!

export default function SettingsPanel() {
  const [hours, setHours] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ loyalty_max_percentage: 50, loyalty_earn_percentage: 5 });
  const [loading, setLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [hoursRes, settingsRes] = await Promise.all([
      supabase.from('store_hours').select('*').order('day_of_week', { ascending: true }),
      supabase.from('store_settings').select('*').eq('id', 1).single()
    ]);
    
    if (hoursRes.data) setHours(hoursRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    
    setLoading(false);
  };

  // --- ΧΕΙΡΙΣΜΟΣ ΩΡΑΡΙΟΥ ---
  const handleUpdateHours = async (day_of_week: number, field: string, value: any) => {
    // Ενημερώνουμε άμεσα την οθόνη (Optimistic UI)
    const updatedHours = hours.map(h => h.day_of_week === day_of_week ? { ...h, [field]: value } : h);
    setHours(updatedHours);
    
    // Ενημερώνουμε τη βάση
    await supabase.from('store_hours').update({ [field]: value }).eq('day_of_week', day_of_week);
  };

  // --- ΧΕΙΡΙΣΜΟΣ ΡΥΘΜΙΣΕΩΝ ΚΑΤΑΣΤΗΜΑΤΟΣ (LOYALTY) ---
  const handleUpdateSettings = async (field: string, value: number) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    await supabase.from('store_settings').upsert({ 
      id: 1, 
      loyalty_max_percentage: settings.loyalty_max_percentage,
      loyalty_earn_percentage: settings.loyalty_earn_percentage
    });
    setIsSavingSettings(false);
    alert('Οι ρυθμίσεις του προγράμματος επιβράβευσης αποθηκεύτηκαν!');
  };

  if (loading) return <div className="text-center text-[#38BDF8] animate-pulse py-10 font-bold">Φόρτωση Ρυθμίσεων...</div>;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      
      {/* 1. ΩΡΑΡΙΟ & ΕΚΤΑΚΤΟ ΚΛΕΙΣΙΜΟ */}
      <div className="bg-[#0F172A]/80 border border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
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
                  onChange={(e) => handleUpdateHours(day.day_of_week, 'open_time', e.target.value + ':00')} 
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-[#38BDF8] font-bold text-lg w-32 text-center transition-colors disabled:opacity-50" 
                  disabled={day.is_closed} 
                />
                <span className="text-gray-500 font-bold">-</span>
                <input 
                  type="time" 
                  value={day.close_time.slice(0, 5)} 
                  onChange={(e) => handleUpdateHours(day.day_of_week, 'close_time', e.target.value + ':00')} 
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-[#38BDF8] font-bold text-lg w-32 text-center transition-colors disabled:opacity-50" 
                  disabled={day.is_closed} 
                />
              </div>
              
              <div className="w-full md:w-40 flex justify-center md:justify-end">
                <button 
                  onClick={() => handleUpdateHours(day.day_of_week, 'is_closed', !day.is_closed)}
                  className={`w-full md:w-auto px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-colors shadow-md ${day.is_closed ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-emerald-500 text-[#0B1120] hover:bg-emerald-400'}`}
                >
                  {day.is_closed ? 'ΚΛΕΙΣΤΑ' : 'ΑΝΟΙΧΤΑ'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-8 text-center bg-slate-800/50 p-4 rounded-xl border border-white/5">
          💡 <strong className="text-white">Tip:</strong> Οι αλλαγές στο ωράριο αποθηκεύονται αυτόματα. Αν βάλετε μια μέρα "ΚΛΕΙΣΤΑ", το καλάθι στο site θα κλειδώσει αμέσως.
        </p>
      </div>

      {/* 2. ΡΥΘΜΙΣΕΙΣ LOYALTY / CASHBACK */}
      <div className="bg-[#0F172A]/80 border border-purple-500/20 p-6 md:p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
        <h2 className="text-2xl font-black text-purple-400 mb-8 uppercase tracking-widest border-b border-purple-500/20 pb-4 flex items-center gap-3">
          <span>🎁</span> Loyalty & Cashback Program
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          <div className="bg-slate-800/50 border border-white/5 p-6 rounded-3xl">
            <label className="block text-sm font-black text-white uppercase tracking-widest mb-2">Ποσοστο Επιστροφης (%)</label>
            <p className="text-xs text-gray-400 mb-6 font-medium">Τι ποσοστό της αξίας της παραγγελίας θα κερδίζει ο πελάτης ως cashback στο πορτοφόλι του.</p>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" max="20" step="1" 
                value={settings.loyalty_earn_percentage} 
                onChange={(e) => handleUpdateSettings('loyalty_earn_percentage', parseInt(e.target.value))} 
                className="w-full accent-[#38BDF8]"
              />
              <div className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center font-black text-xl text-[#38BDF8] shrink-0">
                {settings.loyalty_earn_percentage}%
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/5 p-6 rounded-3xl">
            <label className="block text-sm font-black text-white uppercase tracking-widest mb-2">Οριο Εξαργυρωσης (%)</label>
            <p className="text-xs text-gray-400 mb-6 font-medium">Το μέγιστο ποσοστό της παραγγελίας που επιτρέπεται να πληρώσει ο πελάτης με εξαργύρωση πόντων.</p>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="10" max="100" step="5" 
                value={settings.loyalty_max_percentage} 
                onChange={(e) => handleUpdateSettings('loyalty_max_percentage', parseInt(e.target.value))} 
                className="w-full accent-purple-500"
              />
              <div className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center font-black text-xl text-purple-400 shrink-0">
                {settings.loyalty_max_percentage}%
              </div>
            </div>
          </div>

        </div>

        <button 
          onClick={saveSettings}
          disabled={isSavingSettings}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black text-sm py-4 rounded-2xl uppercase tracking-widest shadow-lg transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSavingSettings ? 'Αποθηκευση...' : 'Αποθηκευση Ρυθμισεων Loyalty'}
        </button>
      </div>

    </div>
  );
}
