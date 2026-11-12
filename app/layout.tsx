import type { Metadata, Viewport } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner'; // Βεβαιώσου ότι το αρχείο είναι στον φάκελο components
import InstallBanner from '@/components/InstallBanner'; // ΠΡΟΣΘΗΚΗ 1: Κάνουμε import το νέο banner

// Το Viewport διαχειρίζεται το πώς φαίνεται και συμπεριφέρεται η εφαρμογή στις οθόνες των κινητών
export const viewport: Viewport = {
  themeColor: '#0B1120',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Αποτρέπει το ενοχλητικό ζουμ όταν οι χρήστες πατάνε γρήγορα τα κουμπιά (+/-) στο καλάθι
};

// Εδώ ρυθμίζουμε το SEO, τα Εικονίδια και το PWA (για εγκατάσταση στο κινητό)
export const metadata: Metadata = {
  title: 'Hellas Aalborg | Ægte Græsk Gyros i Aalborg',
  description: 'Oplev den autentiske græske stemning i hjertet af Aalborg. Vi bringer opskrifterne direkte fra Grækenland til dig. Bestil Takeaway eller via Wolt.',
  
  // Σύνδεση με το manifest.json για να γίνει εγκαταστάσιμο Web App (PWA)
  manifest: '/manifest.json',

  // Ειδικές ρυθμίσεις για να φαίνεται σαν native εφαρμογή στα iPhone (iOS)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hellas',
  },
  
  // Εικονίδια για browser και κινητά
  icons: {
    icon: '/logo.png', // Το εικονίδιο στο tab του browser (Favicon)
    apple: '/apple-icon.png', // Το ειδικό, τετράγωνο εικονίδιο για την οθόνη του iPhone
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
    // suppressHydrationWarning για να μην κρασάρει το React από Adblockers ή εργαλεία μετάφρασης
    <html lang="da" className="scroll-smooth" suppressHydrationWarning>
      <body className="bg-[#0B1120] text-gray-200 antialiased selection:bg-[#38BDF8] selection:text-[#0B1120]" suppressHydrationWarning>
        
        {children}
        <CookieBanner />
        
        {/* ΠΡΟΣΘΗΚΗ 2: Το banner εγκατάστασης που θα εμφανίζεται στα κινητά */}
        <InstallBanner /> 

        {/* ΠΡΟΣΘΗΚΗ 3: Το script που ενεργοποιεί τον "εγκέφαλο" (Service Worker) για το PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { console.log('SW registered'); },
                    function(err) { console.log('SW registration failed: ', err); }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
