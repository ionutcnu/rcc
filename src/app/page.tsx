import React from 'react';
import Header from '../components/Header';
import Landing from '../components/Landing';
import Footer from "@/components/Footer";
import CatsSection from "@/components/CatsSection";
import Particles from "@/components/Particles";
import Tag3d from "@/Utils/3dtag";




export default function Home() {
  return (
      <div>
          <Header/>
          <Landing/>
          <CatsSection/>
          <Tag3d/>
          <Footer/>
      </div>
  );
}
