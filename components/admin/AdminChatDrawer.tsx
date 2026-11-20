'use client';
import React from 'react';

interface AdminChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  supportMessages: any[];
  activeChatOrderId: number | null;
  setActiveChatOrderId: (id: number | null) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onDeleteChat: () => void;
  chatMessagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function AdminChatDrawer({
  isOpen,
  onClose,
  orders,
  supportMessages,
  activeChatOrderId,
  setActiveChatOrderId,
  chatInput,
  setChatInput,
  onSendMessage,
  onDeleteChat,
  chatMessagesEndRef,
}: AdminChatDrawerProps) {
  if (!isOpen) return null;

  const activeChatOrders = Array.from(new Set(supportMessages.map((m) => m.order_id)));
  const currentChatOrder = orders.find((o) => o.id === activeChatOrderId);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[9999] flex justify-end animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-[#0F172A] h-full flex flex-col shadow-2xl border-l border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b border-white/10 bg-slate-900 flex justify-between items-center shrink-0">
          <h2 className="text-base md:text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            💬 Υποστήριξη
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {!activeChatOrderId ? (
          <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-2.5 md:gap-3">
            {activeChatOrders.length === 0 ? (
              <p className="text-center text-gray-500 text-sm mt-10 font-bold uppercase">
                Κανένα ενεργό Chat
              </p>
            ) : (
              activeChatOrders.map((oid) => {
                const msgs = supportMessages.filter((m) => m.order_id === oid);
                const lastMsg = msgs[msgs.length - 1];
                const isUnread = !lastMsg.is_store;
                const orderForList = orders.find((o) => o.id === oid);
                return (
                  <div
                    key={oid}
                    onClick={() => setActiveChatOrderId(oid)}
                    className={`p-3.5 md:p-4 rounded-2xl cursor-pointer border transition-colors shadow-sm ${
                      isUnread
                        ? 'bg-indigo-900/40 border-indigo-500/50'
                        : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-white text-sm">
                        Order #{orderForList?.order_number || oid.toString().slice(-4)} -{' '}
                        {orderForList?.customer_name || 'ΠΕΛΑΤΗΣ'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400">
                        {new Date(lastMsg.created_at).toLocaleTimeString('el-GR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-xs line-clamp-1 ${
                        isUnread ? 'text-indigo-300 font-bold' : 'text-gray-500'
                      }`}
                    >
                      {lastMsg.is_store ? 'Εσείς: ' : 'Πελάτης: '} {lastMsg.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0F172A]">
            <div className="p-3 bg-slate-800 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChatOrderId(null)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-white hover:bg-slate-600 transition-colors"
                >
                  ←
                </button>
                <div className="flex flex-col">
                  <span className="font-black text-white text-sm uppercase">
                    Order #{currentChatOrder?.order_number || activeChatOrderId.toString().slice(-4)} -{' '}
                    {currentChatOrder?.customer_name || 'ΠΕΛΑΤΗΣ'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {currentChatOrder?.customer_phone || ''}
                  </span>
                </div>
              </div>
              <button
                onClick={onDeleteChat}
                className="text-gray-500 hover:text-red-400 p-2 transition-colors"
                title="Διαγραφή Ιστορικού Μηνυμάτων"
              >
                🗑️
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-3 md:gap-4">
              {supportMessages
                .filter((m) => m.order_id === activeChatOrderId)
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.is_store ? 'self-end' : 'self-start'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest mb-1 mx-1 ${
                        msg.is_store ? 'text-[#38BDF8] text-right' : 'text-emerald-400'
                      }`}
                    >
                      {msg.is_store ? 'Εσείς' : currentChatOrder?.customer_name || 'Πελάτης'}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 md:px-4 md:py-3 rounded-2xl text-sm font-medium ${
                        msg.is_store
                          ? 'bg-[#38BDF8] text-[#0B1120] rounded-tr-sm'
                          : 'bg-slate-800 text-white rounded-tl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span
                      className={`text-[9px] text-gray-500 mt-1 mx-1 font-bold ${
                        msg.is_store ? 'text-right' : 'text-left'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString('el-GR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              <div ref={chatMessagesEndRef} />
            </div>
            <form
              onSubmit={onSendMessage}
              className="p-3 md:p-4 bg-slate-900 border-t border-white/5 flex gap-2 shrink-0 pb-6 md:pb-4"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Απάντηση..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 md:px-4 md:py-3 text-sm focus:outline-none focus:border-[#38BDF8] transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-[#38BDF8] text-[#0B1120] font-black uppercase text-xs px-4 md:px-5 rounded-xl disabled:opacity-50 transition-colors"
              >
                SEND
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
