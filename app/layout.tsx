import type { Metadata } from 'next';
import './globals.css';

// 1. Βασικό SEO & Meta Tags
export const metadata: Metadata = {
  title: 'Hellas Aalborg | Ægte Græsk Gyros & Takeaway',
  description: 'Oplev den autentiske græske stemning i hjertet af Aalborg. Bestil gyros, pita og græske specialiteter. Spar penge ved Takeaway!',
  keywords: ['græsk mad Aalborg', 'gyros Aalborg', 'græsk restaurant', 'takeaway Aalborg', 'Hellas Aalborg', 'souvlaki', 'tzatziki'],
  openGraph: {
    title: 'Hellas Aalborg | Authentic Greek Food',
    description: 'Spar penge på vores lækre græske retter ved at bestille direkte som Takeaway.',
    url: 'https://hellasaalborg.dk', // Το μελλοντικό σας domain
    siteName: 'Hellas Aalborg',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
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
  
  // 2. Local Business Schema (Rich Snippets) για το Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Hellas Aalborg",
    "image": "https://hellasaalborg.dk/logo.png",
    "url": "https://hellasaalborg.dk",
    "telephone": "+4542177754",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ved Stranden 21",
      "addressLocality": "Aalborg",
      "postalCode": "9000",
      "addressCountry": "DK"
    },
    "menu": "https://hellasaalborg.dk/#menu",
    "servesCuisine": "Greek",
    "priceRange": "$$"
  };

  return (
    <html lang="da" className="scroll-smooth">
      <head>
        {/* Ενσωμάτωση του Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
