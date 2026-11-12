import type { Metadata, Viewport } from 'next';
import './globals.css';
import CookieBanner from '@/components/CookieBanner'; 

export const viewport: Viewport = {
  themeColor: '#0B1120',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

export const metadata: Metadata = {
  title: 'Hellas Aalborg | Ægte Græsk Gyros i Aalborg',
  description: 'Oplev den autentiske græske stemning i hjertet af Aalborg. Vi bringer opskrifterne direkte fra Grækenland til dig. Bestil Takeaway eller via Wolt.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hellas',
  },
  icons: {
    icon: '/logo.png', 
    apple: '/apple-icon.png', 
  },
  openGraph: {
    title: 'Hellas Aalborg | Smagen af Grækenland',
    description: 'Autentisk græsk mad i hjertet af Aalborg. Bestil Takeaway eller via Wolt.',
    url: 'https://helasaalborg.dk', 
    siteName: 'Hellas Aalborg',
    images: [{ url: '/foto1.jpg', width: 1200, height: 630, alt: 'Hellas Aalborg Authentic Greek Food' }],
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
    <html lang="da" className="scroll-smooth" suppressHydrationWarning>
      <body className="bg-[#0B1120] text-gray-200 antialiased selection:bg-[#38BDF8] selection:text-[#0B1120]" suppressHydrationWarning>
        
        {children}
        <CookieBanner />

        {/* --- ΕΔΩ ΕΝΕΡΓΟΠΟΙΟΥΜΕ ΤΟΝ SERVICE WORKER ΓΙΑ ΤΟ PWA (Αυτόματο Banner Android) --- */}
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
