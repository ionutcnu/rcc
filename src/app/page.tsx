import React from 'react';
import Header from '@/components/layouts/Header';
import Landing from '@/components/elements/Swipe';
import Footer from "@/components/layouts/Footer";
import CatsSection from "@/components/elements/CatsSection";
import Head from 'next/head';





export default function Home() {
  return (
      <div>
          <Head>
              <link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap" rel="stylesheet" />
              <style>
                  {`
                    body {
                      font-family: 'Patrick Hand', cursive;
                    }
                  `}
              </style>
          </Head>
          <Header/>
          <Landing/>
          <CatsSection/>
          <Footer/>
      </div>

  );
}
