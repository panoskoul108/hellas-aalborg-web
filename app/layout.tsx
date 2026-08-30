import type { Metadata } from 'next';
import './globals.css';
import CookieBanner from './CookieBanner';

// Εδώ ρυθμίζουμε το SEO και το Εικονίδιο
export const metadata: Metadata = {
  title: 'Hellas Aalborg | Ægte Græsk Gyros i Aalborg',
  description: 'Oplev den autentiske græske stemning i hjertet af Aalborg. Vi bringer opskrifterne direkte fra Grækenland til dig. Bestil Takeaway eller via Wolt.',
  
  // ΑΥΤΟ ΕΔΩ ΑΛΛΑΖΕΙ ΤΟ ΕΙΚΟΝΙΔΙΟ ΣΤΟ BROWSER:
  icons: {
    icon: '/logo.png', // Χρησιμοποιεί το λογότυπό σας!
    apple: '/logo.png', // Για να φαίνεται ωραία αν κάποιος το αποθηκεύσει σαν εφαρμογή στο iPhone του
  },

  openGraph: {
    title: 'Hellas Aalborg | Smagen af Grækenland',
    description: 'Autentisk græsk mad i hjertet af Aalborg. Bestil Takeaway eller via Wolt.',
    url: 'https://helasaalborg.dk', // Το νέο σας επίσημο domain
    siteName: 'Hellas Aalborg',
    images: [
      {
        url: '/foto1.jpg', 
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
      <body className="bg-[#0B1120] text-gray-200 antialiased selection:bg-[#38BDF8] selection:text-[#0B1120]">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
