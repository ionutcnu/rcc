"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/layouts/Header";
import { cats } from '@/app/data/catsData';
import Image from 'next/image';
import Footer from "@/components/layouts/Footer";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/swiper-bundle.css';

export default function CatProfile() {
    const { alias } = useParams();
    const cat = cats.find((c) => c.alias === alias);

    const [selectedImage, setSelectedImage] = useState(cat?.images[0]);  // Default to the first image
    const [isModalOpen, setIsModalOpen] = useState(false);  // State to manage modal visibility
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);  // Track the index of the selected image

    if (!cat) {
        return (
            <div>
                <Header />
                <p className="text-white">Cat not found.</p>
            </div>
        );
    }

    const openModal = (index:number) => {
        setSelectedImageIndex(index);  // Set the starting image for the modal
        setIsModalOpen(true);  // Open the modal
    };

    const closeModal = () => {
        setIsModalOpen(false);  // Close the modal
    };

    return (
        <>
            <Header />
            <div className="bg-[#1C1C21] text-white min-h-screen">
                <div className="bg-gray-200 text-center py-20 mt-18">
                    <h1 className="text-4xl lg:text-5xl text-black font-bold">{cat.name}</h1>
                    <p className="text-lg lg:text-xl text-blue-950 mt-4">{cat.description}</p>
                </div>

                {/* Responsive layout for mobile: stack text above images */}
                <div className="container mx-auto py-10 px-4 flex flex-col lg:flex-row lg:gap-16 lg:py-16 lg:px-8">
                    <div className="lg:w-1/2 lg:order-2">  {/* Text remains on right on larger screens */}
                        <div className="text-left mb-6 lg:mb-0">
                            <h2 className="text-2xl lg:text-3xl font-bold mb-4">{cat.name} Is Ready for Adoption</h2>
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">ABOUT:</h3>
                            <p className="text-gray-400 leading-relaxed mb-6">{cat.description}</p>
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">COLOR:</h3>
                            <p className="text-gray-400 mb-4">{cat.color}</p>
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">GENDER:</h3>
                            <p className="text-gray-400 mb-4">{cat.gender}</p>
                        </div>
                    </div>

                    <div className="lg:w-1/2 lg:order-1">  {/* Image remains on left on larger screens */}
                        {/* Main Image with onClick to open modal */}
                        <div className="w-full h-[350px] lg:h-[500px] mx-auto relative">
                            <Image
                                src={selectedImage || cat.images[0]}  // Ensure fallback to first image if selectedImage is undefined
                                alt={cat.name}
                                className="rounded-lg shadow-lg object-cover cursor-pointer"
                                layout="fill"
                                onClick={() => openModal(cat.images.indexOf(selectedImage || cat.images[0]))}  // Fallback to first image if undefined
                            />
                        </div>

                        {/* Swiper Carousel for Additional Images */}
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={3}
                            loop={true}
                            navigation={true}  // Fix navigation arrows
                            pagination={{clickable: true}}  // Fix bullet pagination
                            modules={[Navigation, Pagination]}  // Ensure modules are applied correctly
                            className="mt-4 small-carousel"  // Unique class for small carousel
                        >
                            {cat.images.map((image, index) => (
                                <SwiperSlide key={index} className="flex items-center justify-center">
                                    <div className="w-[100px] h-[100px] lg:w-[150px] lg:h-[150px]">
                                        <Image
                                            src={image}
                                            alt={`${cat.name} image ${index + 1}`}
                                            className="rounded-lg object-cover w-full h-full cursor-pointer"
                                            layout="fill"
                                            onClick={() => openModal(index)}  // Open modal when thumbnail clicked
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>

            {/* Modal for Full-Screen Image Scrolling */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        {/* Close Button */}
                        <button
                            className="absolute top-4 right-4 text-white text-2xl z-50"
                            onClick={closeModal}
                        >
                            &times;
                        </button>

                        {/* Fullscreen Swiper Carousel */}
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            initialSlide={selectedImageIndex}  // Start at the clicked image
                            loop={true}
                            navigation={true}  // Ensure navigation arrows work
                            pagination={{ clickable: true }}  // Ensure bullet pagination works
                            modules={[Navigation, Pagination]}  // Apply modules to the modal swiper
                            className="fullscreen-carousel"  // Unique class for the modal carousel
                        >
                            {cat.images.map((image, index) => (
                                <SwiperSlide key={index}>
                                    <img
                                        src={image}
                                        alt={`Slide ${index}`}
                                        className="w-full h-screen object-contain"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
