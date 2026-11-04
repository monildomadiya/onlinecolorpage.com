import type { Metadata, Viewport } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { publicEnv } from '@/lib/env';

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
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
  themeColor: '#8b4ff5',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
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
