'use client';
import React, { useState, useEffect } from "react";
import { supabase } from '../../app/supabase'; // Προσαρμόστε το path αν χρειάζεται

export default function HistoryPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [specificDate, setSpecificDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL"); 
  const [historySearch, setHistorySearch] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  // Φόρτωση δεδομένων βάσει ημερομηνίας
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      let query = supabase.from('orders').select('*').eq('status', 'completed');

      const now = new Date();
      if (dateRange === "today") {
        const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
        query = query.gte('created_at', startOfDay);
      } else if (dateRange === "week") {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte('created_at', startOfWeek);
      } else if (dateRange === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        query = query.gte('created_at', startOfMonth);
      } else if (dateRange === "specific" && specificDate) {
        const start = new Date(specificDate);
        const end = new Date(specificDate);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (data) setOrders(data);
      setIsLoading(false);
    };

    fetchHistory();
  }, [dateRange, specificDate]);

  // Υπολογισμοί Στατιστικών
  const displayedOrders = orders.filter((o) => {
    if (paymentFilter !== "ALL" && o.payment_method !== paymentFilter) return false;
    if (historySearch && !o.customer_name?.toLowerCase().includes(historySearch.toLowerCase()) && !o.id.toString().includes(historySearch)) return false;
    return true;
  });

  const totalRevenue = displayedOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const totalOrdersCount = displayedOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  
  const cashTotal = displayedOrders.filter(o => o.payment_method === 'ΜΕΤΡΗΤΑ').reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  const cardTotal = displayedOrders.filter(o => o.payment_method === 'ΚΑΡΤΑ').reduce((sum, o) => sum + Number(o.total_price || 0), 0);

  // Top 5 Products
  const productCounts: Record<string, number> = {};
  displayedOrders.forEach(o => {
    (o.items || []).forEach((it: any) => {
      const name = it.title_da || it.title_el || it.name;
      productCounts[name] = (productCounts[name] || 0) + (it.quantity || 1);
    });
  });
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxProductCount = topProducts.length > 0 ? topProducts[0][1] : 1;

  // Peak Hours
  const hourCounts: Record<string, number> = {};
  displayedOrders.forEach(o => {
    const h = new Date(o.created_at).getHours().toString().padStart(2, '0');
    const hourStr = `${h}:00`;
    hourCounts[hourStr] = (hourCounts[hourStr] || 0) + 1;
  });
  const peakHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxHourCount = peakHours.length > 0 ? peakHours[0][1] : 1;

  const handleDelete = async () => {
    if(!window.confirm("Σίγουρα θέλετε να διαγράψετε αυτές τις παραγγελίες;")) return;
    await supabase.from('orders').delete().in('id', selectedOrderIds);
    setOrders(prev => prev.filter(o => !selectedOrderIds.includes(o.id)));
    setSelectedOrderIds([]);
  };

  const handlePrintZ = () => {
    window.print(); // Απλή κλήση εκτύπωσης browser για το Ζ report
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 mt-6 animate-fade-in">
      
      <div className="p-4 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-4 justify-between border bg-slate-800 border-slate-700">
        <div className="flex p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar bg-slate-900">
          {["today", "week", "month", "all"].map((r) => (
            <button
              key={r}
              onClick={() => { setDateRange(r); setSpecificDate(""); }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-colors ${
                dateRange === r ? "bg-[#38BDF8] text-[#0B1120] shadow-md" : "text-gray-400 hover:text-white"
              }`}
            >
              {r === "today" ? "ΣΗΜΕΡΑ" : r === "week" ? "ΕΒΔΟΜΑΔΑ" : r === "month" ? "ΜΗΝΑΣ" : "ΟΛΑ"}
            </button>
          ))}
          <input
            type="date"
            value={specificDate}
            onChange={(e) => { setSpecificDate(e.target.value); if (e.target.value) setDateRange("specific"); }}
            className={`ml-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all shadow-sm cursor-pointer outline-none border bg-slate-800 text-white border-slate-700 ${dateRange === "specific" ? "ring-2 ring-[#38BDF8]" : ""}`}
          />
        </div>
        <input
          type="text"
          placeholder="Αναζήτηση Πελάτη/Κωδικού..."
          className="px-4 py-3 rounded-2xl text-sm font-bold shadow-inner outline-none transition-colors bg-slate-900 text-white placeholder-gray-500 border border-slate-700 focus:border-[#38BDF8]"
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center text-[#38BDF8] py-20 font-bold animate-pulse">Ανάκτηση Δεδομένων...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-sky-900/40 border border-sky-800 text-white p-6 rounded-[2rem] shadow-lg flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">Συνολικός Τζίρος</span>
              <span className="text-4xl font-black italic mt-2 text-white">{totalRevenue.toFixed(2)} kr.</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 text-white p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Παραγγελίες</span>
              <span className="text-4xl font-black italic mt-2">{totalOrdersCount}</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 text-white p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Μέση Αξία / Παρ.</span>
              <span className="text-4xl font-black italic mt-2">{avgOrderValue.toFixed(2)} kr.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-[2rem] flex justify-between items-center shadow-sm border bg-emerald-900/20 border-emerald-900/50 text-emerald-400">
              <span className="font-black text-[10px] uppercase">💵 ΜΕΤΡΗΤΑ</span>
              <span className="font-black text-2xl">{cashTotal.toFixed(2)} kr.</span>
            </div>
            <div className="p-4 rounded-[2rem] flex justify-between items-center shadow-sm border bg-indigo-900/20 border-indigo-900/50 text-indigo-400">
              <span className="font-black text-[10px] uppercase">💳 ΚΑΡΤΑ</span>
              <span className="font-black text-2xl">{cardTotal.toFixed(2)} kr.</span>
            </div>
            <button
              onClick={handlePrintZ}
              className="p-4 rounded-[2rem] shadow-lg font-black uppercase text-[11px] transition-transform active:scale-95 flex items-center justify-center gap-2 bg-slate-700 text-white hover:bg-slate-600 border border-slate-600"
            >
              🖨️ ΕΚΤΥΠΩΣΗ Ζ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-[2rem] shadow-sm border bg-slate-800 border-slate-700">
              <h3 className="text-[11px] font-black uppercase mb-4 border-b pb-2 text-gray-500 border-slate-700">Top 5 Προϊόντα</h3>
              <div className="space-y-4">
                {topProducts.map(([name, count]) => (
                  <div key={name} className="relative">
                    <div className="flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 text-gray-200">
                      <span>{name}</span>
                      <span>{count} τεμ.</span>
                    </div>
                    <div className="w-full h-8 rounded-xl overflow-hidden relative bg-slate-900">
                      <div className="h-full rounded-xl transition-all duration-1000 bg-[#38BDF8]/50" style={{ width: `${(count / maxProductCount) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && <p className="text-gray-500 text-xs text-center font-bold">Κανένα δεδομένο.</p>}
              </div>
            </div>
            <div className="p-6 rounded-[2rem] shadow-sm border bg-slate-800 border-slate-700">
              <h3 className="text-[11px] font-black uppercase mb-4 border-b pb-2 text-gray-500 border-slate-700">Ώρες Αιχμής</h3>
              <div className="space-y-4">
                {peakHours.map(([hour, count]) => (
                  <div key={hour} className="relative">
                    <div className="flex justify-between text-xs font-black uppercase italic mb-1 z-10 relative px-2 text-gray-200">
                      <span>{hour}</span>
                      <span>{count} παρ.</span>
                    </div>
                    <div className="w-full h-8 rounded-xl overflow-hidden relative bg-slate-900">
                      <div className="h-full rounded-xl transition-all duration-1000 bg-orange-900/50" style={{ width: `${(count / maxHourCount) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
                {peakHours.length === 0 && <p className="text-gray-500 text-xs text-center font-bold">Κανένα δεδομένο.</p>}
              </div>
            </div>
          </div>

          <div className="pt-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 px-2 gap-4">
              <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Λίστα Παραγγελιών</h3>
              <div className="flex items-center gap-2">
                {["ALL", "ΜΕΤΡΗΤΑ", "ΚΑΡΤΑ"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setPaymentFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${
                      paymentFilter === f ? "bg-white text-black" : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                    }`}
                  >
                    {f === "ALL" ? "ΟΛΕΣ" : f}
                  </button>
                ))}
                <button
                  onClick={handleDelete}
                  disabled={selectedOrderIds.length === 0}
                  className={`ml-4 px-4 py-2 rounded-xl font-black text-[9px] uppercase transition-all ${
                    selectedOrderIds.length > 0 ? "bg-red-500 text-white shadow-lg" : "bg-slate-800 text-gray-600"
                  }`}
                >
                  ΔΙΑΓΡΑΦΗ ({selectedOrderIds.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedOrders.map((o) => (
                <div
                  key={o.id}
                  className={`p-4 rounded-[2rem] flex justify-between items-center transition-all border-2 ${
                    selectedOrderIds.includes(o.id) ? "border-[#38BDF8] bg-sky-900/30" : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex-1 flex justify-between items-center pr-4">
                    <div>
                      <span className="font-black italic text-base text-[#38BDF8]">#{o.order_number || o.id.toString().slice(-4)}</span>
                      <p className="text-[10px] font-bold text-gray-300 mt-0.5">{o.customer_name}</p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                        {new Date(o.created_at).toLocaleTimeString("da-DK", { hour: '2-digit', minute: '2-digit' })} • {o.payment_method}
                      </p>
                    </div>
                    <span className="font-black text-lg tracking-tighter text-white">{Number(o.total_price).toFixed(2)} kr.</span>
                  </div>
                  <div
                    onClick={() => setSelectedOrderIds((prev) => prev.includes(o.id) ? prev.filter((i) => i !== o.id) : [...prev, o.id])}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                      selectedOrderIds.includes(o.id) ? "bg-[#38BDF8] border-[#38BDF8] text-[#0B1120]" : "border-slate-600 text-transparent hover:border-gray-400"
                    }`}
                  >
                    ✓
                  </div>
                </div>
              ))}
              {displayedOrders.length === 0 && (
                <div className="col-span-full text-center py-10 text-xs font-black uppercase tracking-widest text-gray-600">Δεν υπαρχουν παραγγελιες</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
