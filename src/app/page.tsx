import React from 'react';
import Header from '@/components/layouts/Header';
import Landing from '@/components/elements/CatsRelated/HomeCatSlideshow';
import Footer from "@/components/layouts/Footer";
import CatsSection from "@/components/elements/CatsRelated/CatsSection";
import Head from 'next/head';
import Felisa from "@/components/elements/CatsRelated/AboutFelisa";





export default function Home() {
  return (
      <div>
          <Header/>
          <Landing/>
          <CatsSection/>
          <Felisa/>
          <Footer/>
      </div>

  );
}
