"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function HeroSlideshow() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
                    <div className="relative flex items-center justify-center h-[870px] bg-gray-200 border-4 border-gray-300">
                        <div className="absolute inset-0 w-full h-full">
                            <Image
                                src={isMobile ? "/Cats/Images/Garfield.jpeg" : "/Cats/Images/Glori.jpeg"}
                                alt="Hero slide 1"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 100vw"
                                priority
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4">THE JOURNEY STARTS HERE</p>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] bg-gray-200">
                        <div className="absolute inset-0 w-full h-full">
                            <Image
                                src={isMobile ? "/Cats/Images/catm.jpg" : "/Cats/Images/catd.jpg"}
                                alt="Hero slide 2"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 100vw"
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4">THE JOURNEY STARTS HERE</p>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] bg-gray-200">
                        <div className="absolute inset-0 w-full h-full">
                            <Image
                                src={isMobile ? "/Cats/Images/catm3.jpg" : "/Cats/Images/catd3.jpg"}
                                alt="Hero slide 3"
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 100vw"
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4">THE JOURNEY STARTS HERE</p>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            </Swiper>
        </section>
    );
}