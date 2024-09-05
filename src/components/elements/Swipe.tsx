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
                style={{
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            >
                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] mt-[50px] bg-gray-200 border-4 border-gray-300">
                        <img
                            src={isMobile ? "/Cats/Images/Garfield.jpeg" : "/Cats/Images/Glori.jpeg"}
                            alt="1"
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4">THE JOURNEY STARTS HERE</p>
                                <div className="mt-6 flex justify-center">
                                 {/* <button className="bg-orange-500 text-white py-2 px-4 rounded mr-4"> </button> */}

                                </div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>


                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] mt-[50px] bg-gray-200">
                        <img
                            src={isMobile ? "/Cats/Images/catm.jpg" : "/Cats/Images/catd.jpg"}
                            alt="2"
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4">THE JOURNEY STARTS HERE</p>
                                <div className="mt-6 flex justify-center">
                                    {/* <button className="bg-orange-500 text-white py-2 px-4 rounded mr-4"> </button> */}

                                </div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>

                <SwiperSlide>
                    <div className="relative flex items-center justify-center h-[870px] mt-[50px] bg-gray-200">
                        <img
                            src={isMobile ? "/Cats/Images/catm3.jpg" : "/Cats/Images/catd3.jpg"}
                            alt="3"
                            className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4">THE JOURNEY STARTS HERE</p>
                                <div className="mt-6 flex justify-center">
                                    {/* <button className="bg-orange-500 text-white py-2 px-4 rounded mr-4"> </button> */}

                                </div>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
            </Swiper>
        </section>
    );
}
