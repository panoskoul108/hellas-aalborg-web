'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<'da' | 'en'>('da');

  const content = {
    da: {
      back: "← Tilbage til forsiden",
      title: "Privatlivspolitik & Handelsbetingelser",
      s1Title: "1. Dataansvarlig",
      s1Text: "Den dataansvarlige for indsamling og behandling af personoplysninger er:",
      s2Title: "2. Hvilke data vi indsamler",
      s2Text: "Når du afgiver en takeaway-bestilling på vores hjemmeside, indsamler vi kun de oplysninger, der er strengt nødvendige for at gennemføre ordren:",
      i1: "Dit fulde navn",
      i2: "Dit telefonnummer",
      s3Title: "3. Formål med behandlingen",
      s3Text: "Dine personoplysninger bruges udelukkende til at:",
      p1: "Forberede og udlevere din madbestilling.",
      p2: "Kontakte dig i tilfælde af ændringer eller problemer med din ordre.",
      neverShare: "Vi deler aldrig dine oplysninger med tredjeparter til markedsføring.",
      s4Title: "4. Opbevaring & Cookies",
      s4Text: "Vi bruger kun nødvendige cookies (lokal lagring i din browser) for at få indholdet af din indkøbskurv til at fungere og for at beskytte mod spam. Dine ordreoplysninger gemmes i vores system af hensyn til regnskabsloven og slettes rutinemæssigt derefter.",
      s5Title: "5. Dine rettigheder",
      s5Text: "Du har altid ret til at anmode om indsigt i, hvilke data vi har om dig, eller bede om at få dem slettet. Kontakt os blot i restauranten."
    },
    en: {
      back: "← Back to home",
      title: "Privacy Policy & Terms",
      s1Title: "1. Data Controller",
      s1Text: "The data controller for the collection and processing of personal data is:",
      s2Title: "2. What data we collect",
      s2Text: "When you place a takeaway order on our website, we only collect the information strictly necessary to complete the order:",
      i1: "Your full name",
      i2: "Your phone number",
      s3Title: "3. Purpose of processing",
      s3Text: "Your personal data is used exclusively to:",
      p1: "Prepare and deliver your food order.",
      p2: "Contact you in case of changes or issues with your order.",
      neverShare: "We never share your information with third parties for marketing.",
      s4Title: "4. Storage & Cookies",
      s4Text: "We only use essential cookies (local storage in your browser) to make your shopping cart work and to protect against spam. Your order details are stored in our system for accounting purposes and deleted routinely thereafter.",
      s5Title: "5. Your rights",
      s5Text: "You always have the right to request access to the data we hold about you or ask to have it deleted. Simply contact us at the restaurant."
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
        
        {/* Top bar with back link and language switch */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-sky-600 font-black text-sm uppercase tracking-widest hover:underline">
            {t.back}
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={() => setLang('da')} 
              className={`px-3 py-1 rounded text-xs font-black uppercase transition-colors ${lang === 'da' ? 'bg-sky-500 text-gray-900' : 'bg-gray-100 text-gray-500'}`}
            >
              DK
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-3 py-1 rounded text-xs font-black uppercase transition-colors ${lang === 'en' ? 'bg-sky-500 text-gray-900' : 'bg-gray-100 text-gray-500'}`}
            >
              EN
            </button>
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-8 text-gray-900">
          {t.title}
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">{t.s1Title}</h2>
            <p>{t.s1Text}<br/>
            <strong>Nordic-mythos 1 ApS (Hellas Aalborg)</strong><br/>
            Ved Stranden 21, 9000 Aalborg<br/>
            CVR: 46414373</p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">{t.s2Title}</h2>
            <p>{t.s2Text}</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t.i1}</li>
              <li>{t.i2}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">{t.s3Title}</h2>
            <p>{t.s3Text}</p>
            <ul className="list-disc pl-5 mt-2 mb-2 space-y-1">
              <li>{t.p1}</li>
              <li>{t.p2}</li>
            </ul>
            <p><strong>{t.neverShare}</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">{t.s4Title}</h2>
            <p>{t.s4Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">{t.s5Title}</h2>
            <p>{t.s5Text}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
