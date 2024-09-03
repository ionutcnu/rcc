import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <html lang="en">
      <head>
        <link
            href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap"
            rel="stylesheet"
        />
      </head>
      <body className="font-patrick">{children}</body>
      </html>
  );
}
