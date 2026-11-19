'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../supabase';

export default function ResetPasswordPage() {
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setHasRecoverySession(Boolean(data.session));
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || Boolean(session)) {
        setHasRecoverySession(true);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg(
        lang === 'da'
          ? 'Adgangskoden skal være på mindst 6 tegn.'
          : lang === 'en'
          ? 'Password must be at least 6 characters.'
          : 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        lang === 'da'
          ? 'Adgangskoderne er ikke ens.'
          : lang === 'en'
          ? 'Passwords do not match.'
          : 'Οι κωδικοί δεν ταιριάζουν.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (lang === 'da'
            ? 'Kunne ikke opdatere adgangskoden.'
            : lang === 'en'
            ? 'Failed to update password.'
            : 'Αποτυχία ενημέρωσης κωδικού.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-200 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <Link href="/order" className="flex items-center gap-2 text-white font-bold text-sm">
            <Image src="/logo.png" alt="Hellas Aalborg" width={32} height={32} className="object-contain" />
            <span>Hellas Aalborg</span>
          </Link>
          <div className="flex gap-1 text-sm bg-slate-800/70 p-1 rounded-full border border-white/5">
            <button onClick={() => setLang('da')} className={`px-2.5 py-1 rounded-full font-bold ${lang === 'da' ? 'bg-[#38BDF8] text-[#0B1120]' : 'text-gray-400'}`}>DA</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-full font-bold ${lang === 'en' ? 'bg-[#38BDF8] text-[#0B1120]' : 'text-gray-400'}`}>EN</button>
            <button onClick={() => setLang('el')} className={`px-2.5 py-1 rounded-full font-bold ${lang === 'el' ? 'bg-[#38BDF8] text-[#0B1120]' : 'text-gray-400'}`}>EL</button>
          </div>
        </div>

        <h1 className="text-xl font-black text-white uppercase tracking-wide mb-2">
          {lang === 'da' ? 'Ny adgangskode' : lang === 'en' ? 'Reset Password' : 'Νέος Κωδικός'}
        </h1>

        {success ? (
          <div className="space-y-5 mt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-sm font-medium">
              {lang === 'da'
                ? 'Din adgangskode er opdateret. Du kan nu logge ind.'
                : lang === 'en'
                ? 'Your password has been updated. You can now sign in.'
                : 'Ο κωδικός σου ενημερώθηκε επιτυχώς. Μπορείς τώρα να συνδεθείς.'}
            </div>
            <Link
              href="/order"
              className="w-full block text-center bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase tracking-wide py-3.5 rounded-xl transition-colors"
            >
              {lang === 'da' ? 'Gå til bestilling' : lang === 'en' ? 'Go to Order Page' : 'Μετάβαση στην Παραγγελία'}
            </Link>
          </div>
        ) : hasRecoverySession === false ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-400 leading-relaxed">
              {lang === 'da'
                ? 'Linket er ugyldigt eller udløbet. Anmod om et nyt link fra login-formularen.'
                : lang === 'en'
                ? 'This reset link is invalid or expired. Please request a new one from the login form.'
                : 'Ο σύνδεσμος επαναφοράς δεν είναι έγκυρος ή έχει λήξει. Ζήτησε νέο σύνδεσμο από τη φόρμα σύνδεσης.'}
            </p>
            <Link
              href="/order"
              className="w-full block text-center bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wide py-3.5 rounded-xl transition-colors"
            >
              {lang === 'da' ? 'Tilbage' : lang === 'en' ? 'Back' : 'Επιστροφή'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                {lang === 'da' ? 'Ny adgangskode' : lang === 'en' ? 'New Password' : 'Νέος Κωδικός'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 text-white text-sm outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                {lang === 'da' ? 'Gentag adgangskode' : lang === 'en' ? 'Confirm Password' : 'Επιβεβαίωση Κωδικού'}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3.5 text-white text-sm outline-none focus:border-[#38BDF8]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || hasRecoverySession === null}
              className="w-full bg-[#38BDF8] hover:bg-sky-400 text-[#0B1120] font-black uppercase tracking-wide py-3.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? lang === 'da' ? 'Gemmer...' : lang === 'en' ? 'Saving...' : 'Αποθήκευση...'
                : lang === 'da' ? 'Gem ny adgangskode' : lang === 'en' ? 'Save New Password' : 'Αποθήκευση Νέου Κωδικού'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
