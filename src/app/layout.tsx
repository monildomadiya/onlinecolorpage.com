import type { Metadata, Viewport } from 'next';
import { Chango, Rubik } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { publicEnv } from '@/lib/env';

const chango = Chango({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-chango',
  display: 'swap',
});

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rubik',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata();
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Kids pinch-zoom the canvas, so zooming must stay available.
  maximumScale: 5,
  themeColor: '#f9f6f3',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chango.variable} ${rubik.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh antialiased">
        {children}

        {publicEnv.gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${publicEnv.gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${publicEnv.gaId}',{anonymize_ip:true});`}
            </Script>
          </>
        )}

        {publicEnv.adsenseClient && (
          <Script
            id="adsense"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publicEnv.adsenseClient}`}
          />
        )}
      </body>
    </html>
  );
}
