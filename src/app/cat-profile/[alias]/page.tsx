"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
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

    // Use useMemo to memoize the media array
    const media = useMemo(() => [
        ...(cat?.videos || []).map((video) => ({ type: 'video', src: video })),
        ...(cat?.images || []).map((image) => ({ type: 'image', src: image }))
    ], [cat]);

    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);  // Default to the first media (video or image)
    const [selectedMedia, setSelectedMedia] = useState(media[0] || null);  // Default to the first media object
    const [isModalOpen, setIsModalOpen] = useState(false);  // State to manage modal visibility
    const swiperRef = useRef(null);  // To store the Swiper instance

    // Update selectedMedia whenever selectedMediaIndex or media changes
    useEffect(() => {
        if (media.length > 0 && media[selectedMediaIndex]) {
            setSelectedMedia(media[selectedMediaIndex]);
        }
    }, [selectedMediaIndex, media]);

    // Handle Slide Change and Update Main Media
    const handleSlideChange = (swiper: any) => {
        const newIndex = swiper.realIndex;
        setSelectedMediaIndex(newIndex);
    };

    const openModal = (index: number) => {
        setSelectedMediaIndex(index);  // Set the starting media for the modal
        setIsModalOpen(true);  // Open the modal
    };

    const closeModal = () => {
        setIsModalOpen(false);  // Close the modal
    };

    // Prevent video autoplay when clicking on the video frame and open modal instead
    const handleVideoFrameClick = (e: React.MouseEvent) => {
        e.preventDefault();
        openModal(selectedMediaIndex);
    };

    // Pause any non-active videos when the Swiper changes slides in fullscreen mode
    const handleModalSlideChange = (swiper: any) => {
        const currentIndex = swiper.realIndex;
        videoRefs.current.forEach((video: HTMLVideoElement | null, index: number) => {
            if (video && !video.paused && index !== currentIndex) {
                video.pause();  // Pause any video that isn't in the center
            }
        });
    };

    // Return early if cat is not found, but ensure hooks are still called before this point
    if (!cat) {
        return (
            <>
                <Header />
                <p className="text-white">Cat not found.</p>
                <Footer />
            </>
        );
    }

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
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">PRICE:</h3>
                            <p className="text-gray-400 mb-4">${cat.price}</p>
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">ABOUT:</h3>
                            <p className="text-gray-400 leading-relaxed mb-6">{cat.description}</p>
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">COLOR:</h3>
                            <p className="text-gray-400 mb-4">{cat.color}</p>
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">GENDER:</h3>
                            <p className="text-gray-400 mb-4">{cat.gender}</p>

                            {/* New Fields */}
                            <h3 className="text-lg lg:text-xl font-semibold mb-2">BREED:</h3>
                            <p className="text-gray-400 mb-4">{cat.breed}</p>

                            <h3 className="text-lg lg:text-xl font-semibold mb-2">CATEGORY:</h3>
                            <p className="text-gray-400 mb-4">{cat.category}</p>

                            <h3 className="text-lg lg:text-xl font-semibold mb-2">VACCINATED:</h3>
                            <p className="text-gray-400 mb-4">{cat.isVaccinated ? "Yes" : "No"}</p>

                            <h3 className="text-lg lg:text-xl font-semibold mb-2">MICROCHIPPED:</h3>
                            <p className="text-gray-400 mb-4">{cat.isMicrochipped ? "Yes" : "No"}</p>

                            <h3 className="text-lg lg:text-xl font-semibold mb-2">MOTHER NAME:</h3>
                            <p className="text-gray-400 mb-4">{cat.motherName}</p>

                            <h3 className="text-lg lg:text-xl font-semibold mb-2">FATHER NAME:</h3>
                            <p className="text-gray-400 mb-4">{cat.fatherName}</p>


                        </div>
                    </div>

                    <div className="lg:w-1/2 lg:order-1">
                        {/* Main Media (Image or Video) with onClick to open modal */}
                        <div className="w-full h-[350px] lg:h-[500px] mx-auto relative">
                            {selectedMedia?.type === 'video' ? (
                                <video
                                    key={selectedMedia.src}  // Key added to force re-render between videos
                                    controls
                                    className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer main-video"
                                    onClick={handleVideoFrameClick}  // Open modal on video frame click
                                >
                                    <source src={selectedMedia.src} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : selectedMedia ? (
                                <Image
                                    src={selectedMedia.src}
                                    alt={cat.name}
                                    className="rounded-lg shadow-lg object-cover cursor-pointer"
                                    layout="fill"
                                    onClick={() => openModal(selectedMediaIndex)}  // Open modal on click
                                />
                            ) : null}
                        </div>

                        {/* Swiper Carousel for Additional Media */}
                        <Swiper
                            ref={swiperRef}
                            spaceBetween={10}
                            slidesPerView={3}
                            loop={true}
                            navigation={true}  // Fix navigation arrows
                            pagination={{ clickable: true }}  // Fix bullet pagination
                            modules={[Navigation, Pagination]}  // Ensure modules are applied correctly
                            className="mt-4 small-carousel"  // Unique class for small carousel
                            onSlideChange={handleSlideChange}  // Update the large media on slide change
                        >
                            {media.map((item, index) => (
                                <SwiperSlide key={index} className="flex items-center justify-center">
                                    <div className="w-[100px] h-[100px] lg:w-[150px] lg:h-[150px]">
                                        {item.type === 'video' ? (
                                            <video
                                                className="rounded-lg w-full h-full object-cover cursor-pointer"
                                                onClick={() => setSelectedMediaIndex(index)}  // Update large media when clicked
                                            >
                                                <source src={item.src} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <Image
                                                src={item.src}
                                                alt={`${cat.name} media ${index + 1}`}
                                                className="rounded-lg object-cover w-full h-full cursor-pointer"
                                                layout="fill"
                                                onClick={() => setSelectedMediaIndex(index)}  // Update large media when clicked
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
                            modules={[Navigation]}  // Apply modules to the modal swiper
                            className="fullscreen-carousel"
                            onSlideChange={handleModalSlideChange}  // Pause videos when slide changes
                        >
                            {media.map((item, index) => (
                                <SwiperSlide key={index}>
                                    {item.type === 'video' ? (
                                        <video
                                            ref={(el) => {
                                                if (el) videoRefs.current[index] = el;
                                            }}
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
