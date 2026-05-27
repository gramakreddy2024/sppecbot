import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpecBot — 3GPP AI Test Assistant',
  description:
    'Upload 3GPP specs, ask technical questions, and auto-generate test cases for wireless testing.',
  keywords: ['3GPP', '5G NR', 'LTE', 'RF testing', 'test case', 'SpecBot'],
  openGraph: {
    title: 'SpecBot — 3GPP AI Test Assistant',
    description: 'AI-powered 3GPP spec assistant for RF test engineers',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-950 text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
