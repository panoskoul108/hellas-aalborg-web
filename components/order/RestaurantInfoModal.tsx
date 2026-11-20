'use client';
import React from 'react';
import { Icons } from '../Icons';
import { translateDay } from '../../app/utils/orderTranslations';

interface RestaurantInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'da' | 'en' | 'el';
  t: any;
  storeSchedule: any[];
}

export default function RestaurantInfoModal({
  isOpen,
  onClose,
  lang,
  t,
  storeSchedule,
}: RestaurantInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-slate-800/50">
          <h2 className="text-base font-bold text-white uppercase tracking-wide">
            {t.details}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <Icons.Close />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">
              {t.legalName}
            </h3>
            <p className="text-white font-medium text-sm">Nordic-mythos 1 ApS</p>
          </div>

          <div>
            <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">
              {t.cvr}
            </h3>
            <p className="text-white font-medium text-sm">46414373</p>
          </div>

          <div>
            <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-1">
              {t.address}
            </h3>
            <p className="text-gray-300 font-medium text-sm leading-relaxed">
              Ved Stranden 21, 9000
              <br />
              Aalborg, Danmark
            </p>
            <a
              href="https://maps.app.goo.gl/EQMBBoujJMQBvYLy5"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[#38BDF8] hover:text-sky-400 text-sm font-bold transition-colors"
            >
              <Icons.Search /> {t.maps}
            </a>
          </div>

          <div className="pt-5 border-t border-white/5">
            <h3 className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-4">
              {t.hours}
            </h3>
            <ul className="flex flex-col gap-3">
              {storeSchedule.map((day) => (
                <li
                  key={day.day_of_week}
                  className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0"
                >
                  <span className="text-gray-300 font-medium">
                    {translateDay(day.day_name, lang)}
                  </span>
                  <span
                    className={
                      day.is_closed ? 'text-red-400 font-bold' : 'text-white font-medium'
                    }
                  >
                    {day.is_closed
                      ? t.closed
                      : `${day.open_time.slice(0, 5)} - ${day.close_time.slice(0, 5)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
