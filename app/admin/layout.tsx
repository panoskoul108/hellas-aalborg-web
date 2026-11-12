import type { Metadata } from 'next';

// Εδώ κάνουμε override το manifest μόνο για το /admin
export const metadata: Metadata = {
  title: 'Hellas Admin Dashboard',
  manifest: '/admin-manifest.json', // Το κρίσιμο σημείο που καλεί το 2ο app!
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
