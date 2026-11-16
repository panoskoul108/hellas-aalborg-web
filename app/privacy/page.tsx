'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const [lang, setLang] = useState<'da' | 'en' | 'el'>('da');

  const content = {
    da: {
      back: "← Tilbage til forsiden",
      title: "Privatlivspolitik & Handelsbetingelser",
      s1Title: "1. Dataansvarlig",
      s1Text: "Den dataansvarlige for indsamling og behandling af personoplysninger er:",
      s2Title: "2. Hvilke data vi indsamler",
      s2Text: "Når du afgiver en takeaway-bestilling eller opretter en konto, indsamler vi kun de nødvendige oplysninger:",
      i1: "Dit fulde navn og telefonnummer.",
      i2: "Din e-mailadresse og ordrehistorik (hvis du opretter en konto til vores loyalitetsprogram).",
      i3: "Beskeder sendt via vores Live Support Chat i forbindelse med din ordre.",
      s3Title: "3. Formål med behandlingen",
      s3Text: "Dine personoplysninger bruges udelukkende til at:",
      p1: "Forberede og udlevere din madbestilling.",
      p2: "Tilbyde kundeservice via vores Live Chat og kontakte dig ved problemer med din ordre.",
      p3: "Administrere dine loyalitetspoint (Cashback) og ordrehistorik på din konto.",
      neverShare: "Vi deler aldrig dine oplysninger med tredjeparter til markedsføring.",
      s4Title: "4. Opbevaring, Cookies & Chat",
      s4Text: "Vi bruger kun strengt nødvendige cookies (lokal lagring/Local Storage i din browser) for at huske din indkøbskurv, holde dig logget ind og beskytte vores system mod spam. Uden disse kan vores online bestilling ikke fungere. Dine ordreoplysninger gemmes i vores system af hensyn til regnskabsloven. Samtaler i vores Live Chat opbevares i højst 6 måneder for kvalitetssikring, hvorefter de slettes automatisk.",
      s5Title: "5. Dine rettigheder",
      s5Text: "Du har altid ret til at anmode om indsigt i, hvilke data vi har om dig, eller bede om at få dem slettet. Kontakt os blot i restauranten."
    },
    en: {
      back: "← Back to home",
      title: "Privacy Policy & Terms",
      s1Title: "1. Data Controller",
      s1Text: "The data controller for the collection and processing of personal data is:",
      s2Title: "2. What data we collect",
      s2Text: "When you place a takeaway order or create an account, we only collect necessary information:",
      i1: "Your full name and phone number.",
      i2: "Your email address and order history (if you create an account for our loyalty program).",
      i3: "Messages sent via our Live Support Chat regarding your order.",
      s3Title: "3. Purpose of processing",
      s3Text: "Your personal data is used exclusively to:",
      p1: "Prepare and deliver your food order.",
      p2: "Provide customer service via Live Chat and contact you in case of issues with your order.",
      p3: "Manage your loyalty points (Cashback) and order history on your account.",
      neverShare: "We never share your information with third parties for marketing purposes.",
      s4Title: "4. Storage, Cookies & Chat Logs",
      s4Text: "We only use strictly necessary cookies (local storage in your browser) to remember your shopping cart, keep you logged in, and protect our system against spam. Without these, our online ordering cannot function. Your order details are stored in our system for accounting purposes. Conversations in our Live Chat are kept for a maximum of 6 months for quality assurance, after which they are automatically deleted.",
      s5Title: "5. Your rights",
      s5Text: "You always have the right to request access to the data we hold about you or ask to have it deleted. Simply contact us at the restaurant."
    },
    el: {
      back: "← Επιστροφή στην αρχική",
      title: "Πολιτική Απορρήτου & Όροι",
      s1Title: "1. Υπεύθυνος Επεξεργασίας",
      s1Text: "Ο υπεύθυνος επεξεργασίας για τη συλλογή και επεξεργασία των προσωπικών δεδομένων είναι:",
      s2Title: "2. Ποια δεδομένα συλλέγουμε",
      s2Text: "Όταν κάνετε μια παραγγελία takeaway ή δημιουργείτε λογαριασμό, συλλέγουμε μόνο τις απαραίτητες πληροφορίες:",
      i1: "Το ονοματεπώνυμο και τον αριθμό τηλεφώνου σας.",
      i2: "Το email και το ιστορικό παραγγελιών σας (εάν δημιουργήσετε λογαριασμό για το πρόγραμμα επιβράβευσης).",
      i3: "Μηνύματα που αποστέλλονται μέσω του Live Support Chat σχετικά με την παραγγελία σας.",
      s3Title: "3. Σκοπός επεξεργασίας",
      s3Text: "Τα προσωπικά σας δεδομένα χρησιμοποιούνται αποκλειστικά για να:",
      p1: "Προετοιμάσουμε και παραδώσουμε την παραγγελία σας.",
      p2: "Παρέχουμε εξυπηρέτηση πελατών μέσω του Live Chat και να επικοινωνήσουμε μαζί σας σε περίπτωση προβλήματος.",
      p3: "Διαχειριστούμε τους πόντους επιβράβευσης (Cashback) και το ιστορικό παραγγελιών στον λογαριασμό σας.",
      neverShare: "Δεν μοιραζόμαστε ποτέ τις πληροφορίες σας με τρίτους για σκοπούς μάρκετινγκ.",
      s4Title: "4. Αποθήκευση, Cookies & Ιστορικό Chat",
      s4Text: "Χρησιμοποιούμε μόνο απολύτως απαραίτητα cookies (local storage στον browser σας) για να θυμόμαστε το καλάθι αγορών σας, να σας κρατάμε συνδεδεμένους και να προστατεύουμε το σύστημά μας από spam. Χωρίς αυτά, η online παραγγελία δεν μπορεί να λειτουργήσει. Τα στοιχεία της παραγγελίας σας αποθηκεύονται στο σύστημά μας για λογιστικούς σκοπούς. Οι συνομιλίες στο Live Chat διατηρούνται για το πολύ 6 μήνες για σκοπούς διασφάλισης ποιότητας, μετά τους οποίους διαγράφονται αυτόματα.",
      s5Title: "5. Τα δικαιώματά σας",
      s5Text: "Έχετε πάντα το δικαίωμα να ζητήσετε πρόσβαση στα δεδομένα που διατηρούμε για εσάς ή να ζητήσετε τη διαγραφή τους. Απλώς επικοινωνήστε μαζί μας στο κατάστημα."
    }
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-200 animate-fade-in-up">
        
        {/* Top bar with back link and language switch */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <Link href="/" className="text-sky-600 font-black text-sm uppercase tracking-widest hover:underline">
            {t.back}
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={() => setLang('da')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors ${lang === 'da' ? 'bg-sky-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              DK
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors ${lang === 'en' ? 'bg-sky-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('el')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors ${lang === 'el' ? 'bg-sky-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              EL
            </button>
          </div>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest mb-8 text-gray-900 border-b border-gray-100 pb-4">
          {t.title}
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-gray-700">
          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-3">{t.s1Title}</h2>
            <p className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              {t.s1Text}<br/><br/>
              <strong className="text-gray-900">Nordic-mythos 1 ApS (Hellas Aalborg)</strong><br/>
              Ved Stranden 21, 9000 Aalborg<br/>
              CVR: 46414373
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-3">{t.s2Title}</h2>
            <p>{t.s2Text}</p>
            <ul className="list-disc pl-5 mt-3 space-y-2 font-medium">
              <li>{t.i1}</li>
              <li>{t.i2}</li>
              <li>{t.i3}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-3">{t.s3Title}</h2>
            <p>{t.s3Text}</p>
            <ul className="list-disc pl-5 mt-3 mb-4 space-y-2 font-medium">
              <li>{t.p1}</li>
              <li>{t.p2}</li>
              <li>{t.p3}</li>
            </ul>
            <p className="inline-block bg-sky-50 text-sky-800 font-bold px-4 py-2 rounded-lg border border-sky-100">
              {t.neverShare}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-3">{t.s4Title}</h2>
            <p>{t.s4Text}</p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase text-gray-900 mb-3">{t.s5Title}</h2>
            <p>{t.s5Text}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
