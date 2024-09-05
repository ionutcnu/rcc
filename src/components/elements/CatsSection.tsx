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

    // Merge videos and images into one media array with type specification
    const media = [
        ...cat.videos.map((video) => ({ type: 'video', src: video })),
        ...cat.images.map((image) => ({ type: 'image', src: image }))
    ];

    const [selectedMedia, setSelectedMedia] = useState(media[0].src);  // Default to the first media (video or image)
    const [isModalOpen, setIsModalOpen] = useState(false);  // State to manage modal visibility
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);  // Track the index of the selected media

    if (!cat) {
        return (
            <div>
                <Header />
                <p className="text-white">Cat not found.</p>
            </div>
        );
    }

    const openModal = (index: number) => {
        setSelectedMediaIndex(index);  // Set the starting media for the modal
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
                    <div className="lg:w-1/2 lg:order-2">
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

                    <div className="lg:w-1/2 lg:order-1">
                        {/* Main Media (Image or Video) with onClick to open modal */}
                        <div className="w-full h-[350px] lg:h-[500px] mx-auto relative">
                            {media[0].type === 'video' ? (
                                <video
                                    controls
                                    className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer"
                                    onClick={() => openModal(0)}  // Open modal on click
                                >
                                    <source src={media[0].src} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <Image
                                    src={selectedMedia || cat.images[0]}  // Ensure fallback to first image if selectedMedia is undefined
                                    alt={cat.name}
                                    className="rounded-lg shadow-lg object-cover cursor-pointer"
                                    layout="fill"
                                    onClick={() => openModal(media.findIndex((m) => m.src === selectedMedia))}  // Fallback to first image if undefined
                                />
                            )}
                        </div>

                        {/* Swiper Carousel for Additional Media */}
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={3}
                            loop={true}
                            navigation={true}  // Fix navigation arrows
                            pagination={{ clickable: true }}  // Fix bullet pagination
                            modules={[Navigation, Pagination]}  // Ensure modules are applied correctly
                            className="mt-4 small-carousel"  // Unique class for small carousel
                        >
                            {media.map((item, index) => (
                                <SwiperSlide key={index} className="flex items-center justify-center">
                                    <div className="w-[100px] h-[100px] lg:w-[150px] lg:h-[150px]">
                                        {item.type === 'video' ? (
                                            <video
                                                className="rounded-lg w-full h-full object-cover cursor-pointer"
                                                onClick={() => openModal(index)}
                                            >
                                                <source src={item.src} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <Image
                                                src={item.src}
                                                alt={`${cat.name} media ${index + 1}`}
                                                className="rounded-lg object-cover w-full h-full cursor-pointer"
                                                layout="fill"
                                                onClick={() => openModal(index)}  // Open modal when thumbnail clicked
                                            />
                                        )}
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>

            {/* Modal for Full-Screen Media (Image and Video) Scrolling */}
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

                        {/* Fullscreen Swiper for Modal */}
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            initialSlide={selectedMediaIndex}  // Start at the clicked media
                            loop={true}
                            navigation={true}  // Ensure navigation arrows work
                            pagination={{ clickable: true }}  // Ensure bullet pagination works
                            modules={[Navigation, Pagination]}  // Apply modules to the modal swiper
                            className="fullscreen-carousel"
                        >
                            {media.map((item, index) => (
                                <SwiperSlide key={index}>
                                    {item.type === 'video' ? (
                                        <video
                                            controls
                                            className="w-full h-screen object-contain"
                                        >
                                            <source src={item.src} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <img
                                            src={item.src}
                                            alt={`Slide ${index}`}
                                            className="w-full h-screen object-contain"
                                        />
                                    )}
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
