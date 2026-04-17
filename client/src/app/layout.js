import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'PoshanPoint - Daily Poshan, Better Performance',
  description: 'Order fresh smoothie bowls, protein shakes, juices & healthy fitness food right from your phone. PoshanPoint - Fitness Food.',
  manifest: '/manifest.json',
  themeColor: '#4CAF50',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

