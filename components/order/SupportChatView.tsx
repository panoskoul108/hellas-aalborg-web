'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../app/supabase';

interface SupportChatViewProps {
  orderId: number;
  userId?: string | null;
  chatUi: any;
  onBack: () => void;
}

export default function SupportChatView({
  orderId,
  userId,
  chatUi,
  onBack,
}: SupportChatViewProps) {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('support_chats')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (isMounted && data) setChatMessages(data);
    };

    fetchMsgs();

    const channel = supabase
      .channel(`chat_order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chats',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !orderId) return;
    const msg = chatInput.trim();
    setChatInput('');
    await supabase.from('support_chats').insert([
      {
        order_id: orderId,
        user_id: userId || null,
        message: msg,
        is_store: false,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0F172A] absolute inset-0 z-50">
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-slate-900 shrink-0 shadow-md">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
        >
          ←
        </button>
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            {chatUi.support}
          </h2>
          <p className="text-[10px] text-[#38BDF8] font-black uppercase">
            Order #{orderId?.toString().slice(-4)}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 my-auto flex flex-col items-center gap-3">
            <span className="text-4xl">👋</span>
            <p className="text-xs font-bold uppercase">{chatUi.empty}</p>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${msg.is_store ? 'self-start' : 'self-end'}`}
          >
            <span
              className={`text-[9px] font-bold uppercase tracking-widest mb-1 mx-1 ${
                msg.is_store ? 'text-emerald-400' : 'text-[#38BDF8] text-right'
              }`}
            >
              {msg.is_store ? chatUi.store : chatUi.you}
            </span>
            <div
              className={`px-4 py-3 rounded-2xl text-sm font-medium ${
                msg.is_store
                  ? 'bg-slate-800 text-white rounded-tl-sm shadow-sm'
                  : 'bg-[#38BDF8] text-[#0B1120] rounded-tr-sm shadow-md'
              }`}
            >
              {msg.message}
            </div>
            <span className="text-[9px] text-gray-500 mt-1 mx-1 font-bold">
              {new Date(msg.created_at).toLocaleTimeString('da-DK', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={sendChatMessage}
        className="p-4 bg-slate-900 border-t border-white/5 flex gap-2 shrink-0 pb-8 md:pb-4"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={chatUi.typeMsg}
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#38BDF8] transition-colors"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="bg-[#38BDF8] text-[#0B1120] font-black uppercase text-xs px-5 rounded-xl disabled:opacity-50 transition-colors"
        >
          {chatUi.send}
        </button>
      </form>
    </div>
  );
}
