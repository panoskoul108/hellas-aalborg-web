import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
        <Link href="/" className="inline-block mb-8 text-sky-600 font-black text-sm uppercase tracking-widest hover:underline">
          ← Tilbage til forsiden (Πίσω)
        </Link>
        
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-8 text-gray-900">
          Privatlivspolitik & Handelsbetingelser
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">1. Dataansvarlig </h2>
            <p>Den dataansvarlige for indsamling og behandling af personoplysninger er:<br/>
            <strong>Nordic-mythos 1 ApS (Hellas Aalborg)</strong><br/>
            Ved Stranden 21, 9000 Aalborg<br/>
            CVR: 46414373</p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">2. Hvilke data vi indsamler </h2>
            <p>Når du afgiver en takeaway-bestilling på vores hjemmeside, indsamler vi kun de oplysninger, der er strengt nødvendige for at gennemføre ordren:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Dit fulde navn</li>
              <li>Dit telefonnummer </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">3. Formål med behandlingen </h2>
            <p>Dine personoplysninger bruges udelukkende til at:</p>
            <ul className="list-disc pl-5 mt-2 mb-2 space-y-1">
              <li>Forberede og udlevere din madbestilling.</li>
              <li>Kontakte dig i tilfælde af ændringer eller problemer med din ordre.</li>
            </ul>
            <p>Vi deler <strong>aldrig</strong> dine oplysninger med tredjeparter til markedsføring.</p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">4. Opbevaring & Cookies</h2>
            <p>Vi bruger kun "nødvendige cookies" (lokal lagring i din browser) for at huske indholdet af din indkøbskurv og forhindre spam. Dine ordreoplysninger gemmes i vores system af hensyn til regnskabsloven og slettes rutinemæssigt derefter.</p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-2">5. Dine rettigheder </h2>
            <p>Du har altid ret til at anmode om indsigt i, hvilke data vi har om dig, eller bede om at få dem slettet. Kontakt os blot i restauranten.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
