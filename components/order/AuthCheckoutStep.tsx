'use client';
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { supabase } from '../../app/supabase';

interface AuthCheckoutStepProps {
  lang: 'da' | 'en' | 'el';
  ui: any;
  t: any;
  chatUi: any;
  auth: any;
  onProceedToCheckout: () => void;
}

export default function AuthCheckoutStep({
  lang,
  ui,
  t,
  chatUi,
  auth,
  onProceedToCheckout,
}: AuthCheckoutStepProps) {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setShowAuthForm(false);
    setResetMode(false);
    setResetSent(false);
    setResetError('');
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSent(false);

    const targetEmail = (resetEmail || auth.email || '').trim();
    if (!targetEmail) {
      setResetError(chatUi.missingEmail);
      return;
    }

    setResetLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err?.message || 'Error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-2">
      <div className="bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center shrink-0">
          <Icons.Gift />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm mb-1">
            {lang === 'da'
              ? 'Opret konto & få 35 DKK!'
              : lang === 'en'
              ? 'Create an account & get 35 DKK!'
              : 'Φτιάξε λογαριασμό & κέρδισε 35 DKK!'}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {lang === 'da'
              ? 'Saml point og spar på dine næste ordrer.'
              : lang === 'en'
              ? 'Collect points and save on your next orders.'
              : 'Μάζεψε πόντους και κέρδισε έκπτωση στις επόμενες παραγγελίες σου.'}
          </p>
        </div>
      </div>

      {!showAuthForm ? (
        <div className="flex flex-col gap-4 mt-2 animate-fade-in">
          <button
            onClick={() => setShowAuthForm(true)}
            className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black py-4 rounded-xl uppercase tracking-wide transition-transform active:scale-95 shadow-md"
          >
            {lang === 'da'
              ? 'Opret konto / Log ind'
              : lang === 'en'
              ? 'Create Account / Login'
              : 'Εγγραφη / Εισοδος'}
          </button>

          <div className="flex items-center gap-4 my-2 opacity-50">
            <hr className="flex-1 border-slate-600" />
            <span className="text-xs text-slate-400 font-bold uppercase">{ui.or}</span>
            <hr className="flex-1 border-slate-600" />
          </div>

          <div className="text-center">
            <button
              onClick={onProceedToCheckout}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/5 uppercase tracking-wide transition-colors"
            >
              {ui.guestCheckout}
            </button>
            <p className="text-gray-400 text-xs mt-4">{ui.guestDesc}</p>
          </div>
        </div>
      ) : resetMode ? (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5 relative">
            <button
              onClick={() => {
                setShowAuthForm(false);
                setResetMode(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <Icons.Close />
            </button>

            <h3 className="text-base font-bold text-white text-center mb-2 uppercase tracking-wide">
              {chatUi.resetTitle}
            </h3>
            <p className="text-xs text-gray-400 text-center mb-5 leading-relaxed">
              {chatUi.resetDesc}
            </p>

            {resetError && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-xs font-bold text-center border border-red-500/20 mb-4">
                {resetError}
              </div>
            )}

            {resetSent ? (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 text-emerald-300 p-4 rounded-xl text-xs font-medium text-center border border-emerald-500/20 leading-relaxed">
                  {chatUi.resetSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetSent(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wide transition-colors"
                >
                  {chatUi.backToLogin}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder={ui.emailPlh}
                  value={resetEmail || auth.email || ''}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (auth.setEmail) auth.setEmail(e.target.value);
                  }}
                  required
                  className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-bold py-4 rounded-xl uppercase tracking-wide transition-colors disabled:opacity-50"
                >
                  {resetLoading ? chatUi.sendingLink : chatUi.sendResetLink}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetError('');
                  }}
                  className="w-full text-xs text-gray-400 hover:text-white font-bold mt-1 transition-colors"
                >
                  {chatUi.backToLogin}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-white/5 relative">
            <button
              onClick={() => setShowAuthForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <Icons.Close />
            </button>

            <h3 className="text-base font-bold text-white text-center mb-6 uppercase tracking-wide">
              {auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}
            </h3>

            <form onSubmit={(e) => auth.handleAuth(e, onProceedToCheckout)} className="flex flex-col gap-4">
              {auth.authError && (
                <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm font-medium text-center border border-red-500/20">
                  {auth.authError}
                </div>
              )}

              {auth.authMode === 'signup' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <input
                    type="text"
                    placeholder={ui.nameLabel}
                    value={auth.regName}
                    onChange={(e) => auth.setRegName(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder={ui.phoneLabel}
                    value={auth.regPhone}
                    onChange={(e) => auth.setRegPhone(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
                  />
                  <input
                    type="text"
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = 'text';
                    }}
                    placeholder={t.dobPlaceholder}
                    value={auth.regDob}
                    onChange={(e) => auth.setRegDob(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
                  />
                </div>
              )}
              <input
                type="email"
                placeholder={ui.emailPlh}
                value={auth.email}
                onChange={(e) => auth.setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
              />
              <input
                type="password"
                placeholder={ui.passPlh}
                value={auth.password}
                onChange={(e) => auth.setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-[#38BDF8]/50 transition-colors"
              />

              {auth.authMode === 'login' && (
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(auth.email || '');
                      setResetSent(false);
                      setResetError('');
                      setResetMode(true);
                    }}
                    className="text-xs text-gray-400 hover:text-[#38BDF8] font-bold transition-colors"
                  >
                    {chatUi.forgotPass}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-bold py-4 rounded-xl mt-2 uppercase tracking-wide transition-colors"
              >
                {auth.authMode === 'signup' ? ui.regTitle : ui.loginTitle}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                auth.setAuthMode(auth.authMode === 'signup' ? 'login' : 'signup');
                auth.setAuthError('');
              }}
              className="w-full text-sm text-[#38BDF8] hover:text-sky-300 mt-6 font-bold transition-colors"
            >
              {auth.authMode === 'signup' ? ui.hasAcc : ui.noAcc}
            </button>
          </div>

          <div className="flex items-center gap-4 my-2 opacity-50">
            <hr className="flex-1 border-slate-600" />
            <span className="text-xs text-slate-400 font-bold uppercase">{ui.or}</span>
            <hr className="flex-1 border-slate-600" />
          </div>

          <button
            onClick={onProceedToCheckout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/5 uppercase tracking-wide transition-colors"
          >
            {ui.guestCheckout}
          </button>
        </div>
      )}
    </div>
  );
}
