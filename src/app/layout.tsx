// app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './styles/globals.css';
import Providers from './Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Red Cat Cuasar',
    description: 'Red Cat Cuasar',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head>
            <link
                href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap"
                rel="stylesheet"
            />
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body className="font-patrick">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
