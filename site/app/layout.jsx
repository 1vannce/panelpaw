import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

// Dela Gothic One is only used for a handful of Japanese SFX glyphs, so request just those.
const SFX_GLYPHS = 'ドンペラッ完塩月浪人・';
const SFX_FONT_URL = `https://fonts.googleapis.com/css2?family=Dela+Gothic+One&text=${encodeURIComponent(SFX_GLYPHS)}&display=swap`;

export const metadata = {
  title: 'PanelPaw · Every chapter, accounted for.',
  description: 'PanelPaw keeps your place in every manga and manhwa you read. Search the Kitsu catalog, log chapters as you go, and sort titles into your own lists.'
};

export const viewport = { themeColor: '#0B0B0B' };

// Runs before paint: skip the preloader after the first visit in this browser session.
const introScript = `try{if(sessionStorage.getItem('pp-intro-seen'))document.documentElement.classList.add('seen')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={SFX_FONT_URL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
