"use client";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import Particles from "@/components/Particles";
import { Navigation, Pagination } from 'swiper/modules';

export default function CatsSection() {
    const cats = [
        {
            name: "Gura mare",
            description: "Very active and playful, Misty is your trusting buddy when it comes to keeping rats away!",
            image: "/Cats/cat1.jpg",
        },
        {
            name: "Veve",
            description: "She's grumpy and always demands food, but also likes to cuddle in the couch or bed.",
            image: "/Cats/cat3.jpg",
        },
        {
            name: "Ollie",
            description: "He likes to run around and play hide-and-seek. He also loves head and belly rubs!",
            image: "/Cats/cat1.jpg",
        },
        {
            name: "Misty",
            description: "Very active and playful, Misty is your trusting buddy when it comes to keeping rats away!",
            image: "/Cats/cat2.jpg",
        },
        {
            name: "Misty",
            description: "Very active and playful, Misty is your trusting buddy when it comes to keeping rats away!",
            image: "/Cats/cat3.jpg",
        },
        {
            name: "Misty",
            description: "Very active and playful, Misty is your trusting buddy when it comes to keeping rats away!",
            image: "/Cats/cat1.jpg,",
        }

    ];

    return (
        <section className="relative bg-[#1C1C21] text-white py-16">
            <Particles className="absolute inset-0 z-0" quantity={100} staticity={10} ease={50} />
            <div className="container mx-auto text-center relative z-10">
                <h2 className="text-4xl font-semibold mb-4">Meow, meow meow...</h2>
                <p className="text-xl mb-12">Hello we need a new home</p>

                <Swiper
                    spaceBetween={30}
                    slidesPerView={3}
                    navigation={true}
                    pagination={{ clickable: true }}
                    className="w-full h-full"
                >
                    {cats.map((cat, index) => (
                        <SwiperSlide key={index}>
                            <div className="bg-white text-black rounded-lg overflow-hidden shadow-lg">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="object-cover h-56 w-full"
                                />
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                                    <p className="text-gray-700">{cat.description}</p>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

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