import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from './CookieBanner'; // Εισάγουμε το διακριτικό banner που φτιάξαμε

// Εδώ ρυθμίζουμε το SEO (Τίτλοι, Περιγραφές και Εικόνα για τα Social Media)
export const metadata: Metadata = {
  title: 'Hellas Aalborg | Ægte Græsk Gyros i Aalborg',
  description: 'Oplev den autentiske græske stemning i hjertet af Aalborg. Vi bringer opskrifterne direkte fra Grækenland til dig. Bestil Takeaway eller via Wolt.',
  openGraph: {
    title: 'Hellas Aalborg | Smagen af Grækenland',
    description: 'Autentisk græsk mad i hjertet af Aalborg. Bestil Takeaway eller via Wolt.',
    url: 'https://hellasaalborg.dk', // Εδώ θα μπει το τελικό σας domain αν το αλλάξετε
    siteName: 'Hellas Aalborg',
    images: [
      {
        url: '/foto1.jpg', // Αυτή η φωτογραφία θα φαίνεται όταν στέλνετε το link σε μήνυμα!
        width: 1200,
        height: 630,
        alt: 'Hellas Aalborg Authentic Greek Food',
      },
    ],
    locale: 'da_DK',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className="scroll-smooth">
      {/* 
        Το antialiased κάνει τα γράμματα πιο καθαρά.
        Το selection ρυθμίζει το χρώμα όταν κάποιος μαρκάρει κείμενο στο site (γαλάζιο).
      */}
      <body className="bg-[#0B1120] text-gray-200 antialiased selection:bg-[#38BDF8] selection:text-[#0B1120]">
        {children}
        
        {/* Εδώ φορτώνει το Cookie Banner σε κάθε σελίδα, αλλά επιπλέει στο κάτω μέρος χωρίς να χαλάει το design */}
        <CookieBanner />
      </body>
    </html>
  );
}
