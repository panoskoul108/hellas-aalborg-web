import type { Metadata } from 'next';

// Εδώ κάνουμε override το manifest μόνο για το /admin
export const metadata: Metadata = {
  title: 'Hellas Admin Dashboard',
  manifest: '/admin-manifest.json', // Το κρίσιμο σημείο!
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hellas Admin',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-wrapper bg-slate-900 min-h-screen">
      {children}
    </div>
  );
}
import type { Metadata, Viewport } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner'; // Βεβαιώσου ότι το αρχείο είναι στον φάκελο components

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
      </body>
    </html>
  );
}
