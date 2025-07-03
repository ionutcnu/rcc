"use client";
import React, { useEffect, useState } from 'react';
import Header from '@/components/layouts/Header';
import Landing from './components/HomeCatSlideshow';
import Footer from "@/components/layouts/Footer";
import CatsSection from "./components/CatsSection";
import { GiCat, GiPawPrint } from "react-icons/gi";
import MeetFelissa from "./components/AboutFelisa";





export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
      <div className="min-h-screen cat-bg-pattern relative overflow-hidden">
          {/* Floating Cat Elements */}
          <div className="cat-float top-20 left-10 cat-float-delayed">
              <GiCat className="w-16 h-16 text-red-300" />
          </div>
          <div className="cat-float top-40 right-20 cat-float-slow">
              <GiPawPrint className="w-12 h-12 text-blue-300" />
          </div>
          <div className="cat-float bottom-40 left-1/4">
              <GiCat className="w-20 h-20 text-orange-300" />
          </div>
          
          {/* Main Content */}
          <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <Header/>
              <main className="relative">
                  <Landing/>
                  <div className="bg-gradient-to-b from-transparent via-white/50 to-white/80">
                      <CatsSection/>
                      <MeetFelissa/>
                  </div>
              </main>
              <Footer/>
          </div>
      </div>
  );
}
