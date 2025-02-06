"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/layouts/Header";
import { cats } from '@/app/data/catsData';
import Image from 'next/image';
import Footer from "@/components/layouts/Footer";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ParentInfoPopup from '@/components/elements/CatsRelated/ParentInfoModal';
import 'swiper/swiper-bundle.css';

export default function CatProfile() {
    const { alias } = useParams();
    const cat = cats.find((c) => c.alias === alias);

    const media = useMemo(() => [
        ...(cat?.videos || []).map((video) => ({ type: 'video', src: video })),
        ...(cat?.images || []).map((image) => ({ type: 'image', src: image }))
    ], [cat]);

    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState(media[0] || null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const swiperRef = useRef(null);

    useEffect(() => {
        if (media.length > 0 && media[selectedMediaIndex]) {
            setSelectedMedia(media[selectedMediaIndex]);
        }
    }, [selectedMediaIndex, media]);

    const openModal = (index: number) => {
        if (selectedMedia?.type === 'video' && videoRefs.current[index] && !videoRefs.current[index]?.paused) {
            videoRefs.current[index]?.pause();
        }
        setSelectedMediaIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleVideoFrameClick = (e: React.MouseEvent) => {
        e.preventDefault();
        openModal(selectedMediaIndex);
    };

    const handleSlideChange = (swiper: any) => {
        const newIndex = swiper.realIndex;
        setSelectedMediaIndex(newIndex);
    };

    const handleModalSlideChange = (swiper: any) => {
        const currentIndex = swiper.realIndex;
        videoRefs.current.forEach((video: HTMLVideoElement | null, index: number) => {
            if (video && !video.paused && index !== currentIndex) {
                video.pause();
            }
        });
    };

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

                <div className="container mx-auto py-10 px-4 flex flex-col lg:flex-row lg:gap-16 lg:py-16 lg:px-8">
                    <div className="lg:w-1/2 lg:order-2">
                        <div className="text-left mb-6 lg:mb-0">
                            <h2 className="text-2xl lg:text-3xl font-bold mb-4">{cat.name} Is Ready for Adoption</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">PRICE:</h3>
                                  <p className="text-2xl lg:text-3xl text-blue-500 font-bold mb-4">€{cat.price}</p>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">COLOR:</h3>
                                    <p className="text-gray-400 mb-4">{cat.color}</p>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">GENDER:</h3>
                                    <p className="text-gray-400 mb-4">{cat.gender}</p>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">BREED:</h3>
                                    <p className="text-gray-400 mb-4">{cat.breed}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">CATEGORY:</h3>
                                    <p className="text-gray-400 mb-4">{cat.category}</p>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">VACCINATED:</h3>
                                    <p className="text-gray-400 mb-4">{cat.isVaccinated ? "Yes" : "No"}</p>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">MICROCHIPPED:</h3>
                                    <p className="text-gray-400 mb-4">{cat.isMicrochipped ? "Yes" : "No"}</p>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">CONTACT:</h3>
                                    <p className="text-gray-400 mb-4">Phone: +1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <ParentInfoPopup
                                    motherName={cat.motherName || "Unknown Mother"}
                                    motherImage={cat.motherImage || "/default-mother.jpg"}
                                    motherDescription={cat.motherDescription || "No description available"}
                                    fatherName={cat.fatherName || "Unknown Father"}
                                    fatherImage={cat.fatherImage || "/default-father.jpg"}
                                    fatherDescription={cat.fatherDescription || "No description available"}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 lg:order-1">
                        <div className="w-full h-[350px] lg:h-[500px] mx-auto relative">
                            {selectedMedia?.type === 'video' ? (
                                <video
                                    key={selectedMedia.src}
                                    controls
                                    ref={(el) => {
                                        if (el) videoRefs.current[selectedMediaIndex] = el;
                                    }}
                                    className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer main-video"
                                    onClick={handleVideoFrameClick}
                                >
                                    <source src={selectedMedia.src} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : selectedMedia ? (
                                <Image
                                    src={selectedMedia.src}
                                    alt={cat.name}
                                    className="rounded-lg shadow-lg object-cover cursor-pointer"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    onClick={() => openModal(selectedMediaIndex)}
                                />
                            ) : null}
                        </div>

                        <Swiper
                            ref={swiperRef}
                            spaceBetween={10}
                            slidesPerView={3}
                            loop={true}
                            navigation={true}
                            pagination={{ clickable: true }}
                            modules={[Navigation, Pagination]}
                            className="mt-4 small-carousel"
                            onSlideChange={handleSlideChange}
                        >
                            {media.map((item, index) => (
                                <SwiperSlide key={index} className="flex items-center justify-center">
                                    <div className="w-[100px] h-[100px] lg:w-[150px] lg:h-[150px] relative">
                                        {item.type === 'video' ? (
                                            <video
                                                className="rounded-lg w-full h-full object-cover cursor-pointer"
                                                onClick={() => setSelectedMediaIndex(index)}
                                            >
                                                <source src={item.src} type="video/mp4" />
                                            </video>
                                        ) : (
                                            <Image
                                                src={item.src}
                                                alt={`${cat.name} media ${index + 1}`}
                                                className="rounded-lg object-cover cursor-pointer"
                                                fill
                                                sizes="(max-width: 768px) 100px, 150px"
                                                onClick={() => setSelectedMediaIndex(index)}
                                            />
                                        )}
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        <button
                            className="absolute top-4 right-4 text-white text-2xl z-50"
                            onClick={closeModal}
                        >
                            &times;
                        </button>

                        <Swiper
                            spaceBetween={10}
                            slidesPerView={1}
                            initialSlide={selectedMediaIndex}
                            loop={true}
                            navigation={true}
                            pagination={{ clickable: true }}
                            modules={[Navigation]}
                            className="fullscreen-carousel"
                            onSlideChange={handleModalSlideChange}
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
                                        <div className="relative w-full h-screen">
                                            <Image
                                                src={item.src}
                                                alt={`Slide ${index}`}
                                                fill
                                                className="object-contain"
                                                sizes="100vw"
                                                priority={index === 0}
                                            />
                                        </div>
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