"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import React, { useState, useEffect } from 'react';

export default function HeroSlideshow() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize); // Listen for window resize events

        return () => window.removeEventListener('resize', handleResize); // Cleanup
    }, []);

    return (
        <section className="relative">
            <Swiper
                spaceBetween={50}
                navigation={true}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                modules={[Navigation, Pagination, Autoplay]}
                className="w-full h-full"
            >
                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] mt-[50px] bg-gray-200">
                        <img
                            src={isMobile ? "/Cats/Garfield.jpeg" : "/Cats/Glori.jpeg"}
                            alt="1"
                            className="object-cover w-full h-full"
                        />
                        <div
                            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white text-4xl">
                            <div className="text-center">
                                <h1>some text</h1>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] mt-[50px] bg-gray-200">
                        <img
                            src={isMobile ? "/Cats/catm.jpg" : "/Cats/catd.jpg"}
                            alt="2"
                            className="object-cover w-full h-full"
                        />
                        <div
                            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white text-4xl">
                            <div className="text-center">
                                <h1>some text</h1>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] mt-[50px] bg-gray-200">
                        <img
                            src={isMobile ? "/Cats/catm3.jpg" : "/Cats/catd3.jpg"}
                            alt="2"
                            className="object-cover w-full h-full"
                        />
                        <div
                            className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center text-white text-4xl">
                            <div className="text-center">
                                <h1>some text</h1>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

            </Swiper>

            <style jsx>{`
                .swiper-pagination-bullets {
                    bottom: 100px !important; 
                }
            `}</style>
        </section>
    );
}
