import type { Metadata } from "next";
import { Inter, Patrick_Hand } from "next/font/google";
import "./styles/globals.css";

// Configure main fonts
const inter = Inter({
    subsets: ["latin"],
    variable: '--font-inter',
    display: 'swap'
});

const patrickHand = Patrick_Hand({
    weight: '400',
    subsets: ['latin'],
    variable: '--font-patrick',
    display: 'swap'
});

export const metadata: Metadata = {
    title: "Red Cat Cuasar",
    description: "Red Cat Cuasar",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${patrickHand.variable}`}>
        <head>
            <link rel="icon" href="/favicon.ico" />
        </head>
        <body className="font-patrick">
        {children}
        </body>
        </html>
    );
}