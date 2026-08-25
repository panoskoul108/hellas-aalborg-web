import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0B1120] text-gray-300 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-slate-900/50 p-8 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-8">Privacy Policy & Cookie Statement</h1>
        <p className="mb-6 leading-relaxed text-gray-400">Welcome to Hellas Aalborg. This privacy policy explains how we collect, use, and protect your personal information when you visit our website.</p>
        
        <h2 className="text-xl font-bold text-[#38BDF8] mt-8 mb-4">1. Data Controller</h2>
        <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-400">
          <li><strong>Company:</strong> Nordic-mythos 1 ApS</li>
          <li><strong>CVR:</strong> 46414373</li>
          <li><strong>Address:</strong> Ved Stranden 21, 9000 Aalborg, Denmark</li>
          <li><strong>Email:</strong> hellasaalborg@gmail.com</li>
        </ul>

        <h2 className="text-xl font-bold text-[#38BDF8] mt-8 mb-4">2. Cookies & Analytics</h2>
        <p className="mb-6 leading-relaxed text-gray-400">We use basic cookies to ensure our website functions correctly. If you place an order via Wolt, your data is processed securely according to Wolt's independent privacy policy.</p>

        <h2 className="text-xl font-bold text-[#38BDF8] mt-8 mb-4">3. Contact Us</h2>
        <p className="mb-10 leading-relaxed text-gray-400">For any GDPR-related inquiries or requests regarding your personal data, please contact us directly at hellasaalborg@gmail.com.</p>

        <Link href="/" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
