import { Dela_Gothic_One, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
// Self-hosted at build time. Only used for a few Japanese SFX glyphs; the browser fetches
// just the unicode-range slices those glyphs need, so nothing is preloaded.
const sfx = Dela_Gothic_One({ weight: '400', subsets: ['latin'], variable: '--font-sfx', display: 'swap', preload: false });

const TITLE = 'PanelPaw · Every chapter, accounted for.';
const DESCRIPTION = 'PanelPaw keeps your place in every manga and manhwa you read. Search the Kitsu catalog, log chapters as you go, and sort titles into your own lists.';

export const metadata = {
  metadataBase: new URL('https://panelpaw.vercel.app'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: '/', siteName: 'PanelPaw', type: 'website', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PanelPaw wordmark over manga panels' }] },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og.png'] }
};

export const viewport = { themeColor: '#0B0B0B' };

// Runs before paint: skip the preloader after the first visit in this browser session.
const introScript = `try{if(sessionStorage.getItem('pp-intro-seen'))document.documentElement.classList.add('seen')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${sfx.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
