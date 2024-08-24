import React from 'react';
import Header from '../components/Header';
import Landing from '../components/Landing';
import Footer from "@/components/Footer";
import CatsSection from "@/components/CatsSection";



export default function Home() {
  return (
      <div>
        <Header/>
          <Landing/>
          <CatsSection/>
       <Footer/>
      </div>

  );
}
