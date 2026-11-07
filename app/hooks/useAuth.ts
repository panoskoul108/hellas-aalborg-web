import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [userOrderHistory, setUserOrderHistory] = useState<any[]>([]);

  // Λήψη Στοιχείων Πελάτη (Όνομα & Τηλέφωνο)
  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase.from('customers_loyalty').select('*').eq('user_id', userId).single();
    if (data) {
      setCustomerName(data.full_name || '');
      setCustomerPhone(data.phone || '');
    }
  };

  // Παρακολούθηση της σύνδεσης & Φόρτωση Στοιχείων σε Refresh
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id); // Φέρνει τα στοιχεία αυτόματα!
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCustomerName('');
        setCustomerPhone('');
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  // Λογική Σύνδεσης / Εγγραφής
  const handleAuth = async (e: React.FormEvent, onSuccess: () => void) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'signup') {
      if (!regName || !regPhone) { setAuthError('Missing Name or Phone.'); return; }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: regName, phone: regPhone } } });
      if (error) { setAuthError(error.message); } 
      else if (data.user) {
        setUser(data.user);
        await supabase.from('customers_loyalty').insert({ user_id: data.user.id, full_name: regName, phone: regPhone, date_of_birth: regDob || null, wallet_balance: 0 });
        setCustomerName(regName); setCustomerPhone(regPhone); 
        onSuccess();
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError('Wrong email or password.');
      else { 
        setUser(data.user); 
        // Η fetchUserProfile καλείται αυτόματα από το onAuthStateChange παραπάνω!
        onSuccess();
      }
    }
  };

  // Άντληση ιστορικού παραγγελιών
  const fetchOrderHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    if (data) setUserOrderHistory(data);
  };

  // Αποσύνδεση
  const logout = async (onLogout: () => void) => {
    await supabase.auth.signOut();
    setUser(null);
    setCustomerName('');
    setCustomerPhone('');
    onLogout();
  };

  return {
    user, authMode, setAuthMode, email, setEmail, password, setPassword,
    authError, setAuthError, regName, setRegName, regPhone, setRegPhone, regDob, setRegDob,
    customerName, setCustomerName, customerPhone, setCustomerPhone,
    userOrderHistory, handleAuth, fetchOrderHistory, logout
  };
}
