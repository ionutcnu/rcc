"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/layouts/Header";
import { cats } from '@/app/data/catsData';
import Image from 'next/image';
import Footer from "@/components/layouts/Footer";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination} from 'swiper/modules';
import 'swiper/swiper-bundle.css';


export default function CatProfile() {
    const { alias } = useParams();

    // Find the matching cat by alias
    const cat = cats.find((c) => c.alias === alias);

    // State to store the currently selected image
    const [selectedImage, setSelectedImage] = useState(cat?.images[0]);  // Default to the first image

    if (!cat) {
        return (
            <div>
                <Header />
                <p className="text-white">Cat not found.</p>
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="bg-[#1C1C21] text-white min-h-screen">
                <div className="bg-gray-200 text-center py-20 mt-18">
                    <h1 className="text-5xl text-black font-bold">{cat.name}</h1>
                    <p className="text-xl text-blue-950 mt-xl-4">{cat.description}</p>
                </div>

                <div className="container mx-auto py-16 px-8 flex flex-col lg:flex-row gap-16">
                    <div className="lg:w-1/2">
                        {/* Main Image with Fixed Dimensions */}
                        <div className="w-[500px] h-[500px] mx-auto relative">
                            <Image
                                src={selectedImage || ''}  // Fallback to placeholder if undefined
                                alt={cat.name}
                                className="rounded-lg shadow-lg object-cover"
                                layout="fill"
                            />
                        </div>

                        {/* Swiper Carousel for Additional Images */}
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={3}
                            loop={true}
                            navigation={true}  // Enable navigation arrows
                            pagination={{clickable: true}}  // Enable bullet pagination
                            modules={[Navigation, Pagination]}  // Use Swiper's Navigation and Pagination modules
                            className="mt-4"
                        >
                            {cat.images.slice(1).map((image, index) => (
                                <SwiperSlide key={index} className="flex items-center justify-center">
                                    <div className="w-[150px] h-[150px]">
                                        <Image
                                            src={image}
                                            alt={`${cat.name} image ${index + 1}`}
                                            className="rounded-lg object-cover w-full h-full cursor-pointer"
                                            layout="fill"  // Ensuring it fills the container
                                            onClick={() => setSelectedImage(image)}  // Set the clicked image as the selected image
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>


                </div>

                <div className="lg:w-1/2 text-left">
                    <h2 className="text-3xl font-bold mb-4">{cat.name} Is Ready for Adoption</h2>
                    <h3 className="text-xl font-semibold mb-2">ABOUT:</h3>
                    <p className="text-gray-400 leading-relaxed mb-6">{cat.description}</p>
                        <h3 className="text-xl font-semibold mb-2">COLOR:</h3>
                        <p className="text-gray-400 mb-4">{cat.color}</p>
                        <h3 className="text-xl font-semibold mb-2">GENDER:</h3>
                        <p className="text-gray-400 mb-4">{cat.gender}</p>
                    </div>
                </div>
            </div>
            <Footer />
        </>

    );
}
