"use client";
import { cats } from '@/app/data/catsData';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import Particles from "./Particles";
import { useRef } from 'react';
import Link from 'next/link';
import SwiperCore from 'swiper';

export default function CatsSection() {
    const swiperRef = useRef<SwiperCore>();


    return (
        <section className="relative bg-[#1C1C21] text-white py-16">
            <Particles className="absolute inset-0 z-0" quantity={100} staticity={10} ease={50} />
            <div className="container mx-auto text-center relative z-10">
                <h2 className="text-4xl font-semibold mb-4">Meow, meow meow...</h2>
                <p className="text-xl mb-12">Hello we need a new home</p>

                <Swiper
                    onSwiper={(swiper) => {
                        swiperRef.current = swiper;
                    }}
                    spaceBetween={30}
                    slidesPerView={1}
                    breakpoints={{
                        1024: {
                            slidesPerView: 3,
                        },
                    }}
                    pagination={{ clickable: true }}
                    className="w-full h-full"
                >
                    {cats.map((cat) => (
                        <SwiperSlide key={cat.alias}>
                            <Link href={`/cat-profile/${cat.alias}`} key={cat.id}>
                                <div className="bg-white text-black rounded-lg overflow-hidden shadow-lg cursor-pointer">
                                    <img
                                        src={cat.mainImage}
                                        alt={cat.name}
                                        className="object-cover h-56 w-full"
                                    />
                                    <div className="p-6">
                                        <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                                        <p className="text-gray-700">{cat.description}</p>
                                    </div>
                                </div>
                            </Link>
                        </SwiperSlide>
                    ))}
                </Swiper>

                <div className="mt-4 flex justify-center">
                    <button
                        className="text-alabaster-600 bg-alabaster-900 hover:bg-seance-700 border border-alabaster-900 rounded-full h-12 w-12 flex items-center justify-center"
                        onClick={() => swiperRef.current?.slidePrev()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <button
                        className="text-alabaster-600 bg-alabaster-900 hover:bg-seance-700 border border-alabaster-900 rounded-full h-12 w-12 flex items-center justify-center ml-4"
                        onClick={() => swiperRef.current?.slideNext()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>

                <p className="mt-12 text-lg">
                    Rescued from the streets of Spain, these felines are treated with love, care, and full vaccinations.
                </p>
                <p className="text-lg">They’re now healthy and excited to meet their new owners!</p>
                <a href="/cats" className="text-yellow-500 mt-4 inline-block text-lg hover:underline">
                    See all cats &gt;
                </a>
            </div>
        </section>
    );
}