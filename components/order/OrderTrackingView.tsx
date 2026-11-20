'use client';
import React from 'react';
import { Icons } from '../Icons';

interface OrderTrackingViewProps {
  placedOrder: any;
  lang: 'da' | 'en' | 'el';
  ui: any;
  t: any;
  chatUi: any;
  hasUnreadStoreMsg: boolean;
  onCustomerPickup: () => void;
  onOpenChat: (orderId: number) => void;
}

export default function OrderTrackingView({
  placedOrder,
  lang,
  ui,
  t,
  chatUi,
  hasUnreadStoreMsg,
  onCustomerPickup,
  onOpenChat,
}: OrderTrackingViewProps) {
  return (
    <div className="flex flex-col items-center py-6 w-full">
      <h2 className="text-xl font-bold text-white mb-8 tracking-widest text-center">
        #{placedOrder?.order_number || placedOrder?.id?.toString().slice(-4)}
      </h2>

      {placedOrder?.status !== 'cancelled' && (
        <div className="w-full mb-10 relative">
          <div className="absolute top-4 left-0 h-1 bg-slate-800 w-full -z-10 rounded-full"></div>
          <div
            className={`absolute top-4 left-0 h-1 bg-[#38BDF8] -z-10 transition-all duration-700 ease-out rounded-full ${
              placedOrder?.status === 'pending'
                ? 'w-[15%]'
                : placedOrder?.status === 'preparing'
                ? 'w-[50%]'
                : 'w-full !bg-emerald-500'
            }`}
          ></div>
          <div className="flex justify-between">
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
                  placedOrder?.status === 'pending' ||
                  placedOrder?.status === 'preparing' ||
                  placedOrder?.status === 'completed'
                    ? 'bg-[#38BDF8] text-[#0B1120]'
                    : 'bg-slate-800 text-gray-500'
                }`}
              >
                1
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  placedOrder?.status === 'pending' ? 'text-white' : 'text-gray-500'
                }`}
              >
                {ui.trackPending}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
                  placedOrder?.status === 'preparing' || placedOrder?.status === 'completed'
                    ? 'bg-[#38BDF8] text-[#0B1120]'
                    : 'bg-slate-800 text-gray-500'
                }`}
              >
                2
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  placedOrder?.status === 'preparing' ? 'text-white' : 'text-gray-500'
                }`}
              >
                {ui.trackPrep}
              </span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-500 ${
                  placedOrder?.status === 'completed'
                    ? 'bg-emerald-500 text-[#0B1120]'
                    : 'bg-slate-800 text-gray-500'
                }`}
              >
                3
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  placedOrder?.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'
                }`}
              >
                {ui.trackReady}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="w-full bg-slate-800/30 border border-white/5 rounded-2xl p-8 mb-6 text-center">
        {placedOrder?.status === 'pending' && (
          <div className="animate-fade-in">
            <div className="w-12 h-12 border-4 border-[#38BDF8]/20 border-t-[#38BDF8] rounded-full animate-spin mx-auto mb-5"></div>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
              {ui.trackPendingTitle}
            </h3>
            <p className="text-sm text-gray-400">{ui.trackPendingDesc}</p>
          </div>
        )}
        {placedOrder?.status === 'preparing' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-5 animate-pulse">
              <Icons.Clock />
            </div>
            <h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wide">
              {ui.trackPrepTitle}
            </h3>
            <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-xl p-4 inline-block">
              <p className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest mb-1">
                {ui.trackPrepTime}
              </p>
              <p className="text-4xl font-bold text-white">
                {placedOrder?.requested_time && placedOrder.requested_time !== 'ASAP'
                  ? placedOrder.requested_time.slice(0, 5)
                  : '...'}
              </p>
            </div>
          </div>
        )}
        {placedOrder?.status === 'completed' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-5">
              <Icons.Check />
            </div>
            <h3 className="text-lg font-bold text-emerald-400 mb-3 uppercase tracking-wide">
              {ui.trackReadyTitle}
            </h3>
            <p className="text-sm text-gray-300 mb-8">{ui.trackReadyDesc}</p>
            <button
              onClick={onCustomerPickup}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0B1120] font-bold text-sm uppercase py-4 rounded-xl transition-colors tracking-wide"
            >
              {t.pickupConfirm}
            </button>
          </div>
        )}

        {placedOrder?.status === 'cancelled' && (
          <div className="animate-fade-in">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mx-auto mb-5">
              <Icons.Close />
            </div>
            <h3 className="text-lg font-bold text-red-400 mb-3 uppercase tracking-wide">
              {lang === 'da'
                ? 'Ordren er annulleret'
                : lang === 'en'
                ? 'Order Cancelled'
                : 'Η παραγγελία ακυρώθηκε'}
            </h3>
            <p className="text-sm text-gray-300 mb-8">
              {lang === 'da'
                ? 'Beklager, vi kan desværre ikke behandle denne ordre på nuværende tidspunkt.'
                : lang === 'en'
                ? 'Sorry, we cannot fulfill this order at this time.'
                : 'Συγγνώμη, δεν μπορούμε να εξυπηρετήσουμε αυτή την παραγγελία αυτή τη στιγμή.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('hellas_active_order');
                window.location.reload();
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm uppercase py-4 rounded-xl transition-colors tracking-wide"
            >
              {ui.close || (lang === 'da' ? 'LUK' : lang === 'en' ? 'CLOSE' : 'ΚΛΕΙΣΙΜΟ')}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => onOpenChat(placedOrder.id)}
        className={`w-full font-bold uppercase tracking-widest text-xs py-4 rounded-2xl flex items-center justify-center gap-2 transition-all relative ${
          hasUnreadStoreMsg
            ? 'bg-[#38BDF8] text-[#0B1120] shadow-lg animate-pulse'
            : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700'
        }`}
      >
        💬 {chatUi.needHelp}
        {hasUnreadStoreMsg && (
          <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0B1120]">
            !
          </span>
        )}
      </button>
    </div>
  );
}
