"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ParentInfoModal from '@/components/elements/ParentInfoModal';
import 'swiper/swiper-bundle.css';
import { useTranslation } from 'react-i18next';
import { catsEn } from '@/app/data/catsData.en';
import { catsRo } from '@/app/data/catsData.ro';

type Cat = {
    alias: string;
    name: string;
    description: string;
    price: number;
    color: string;
    gender: string;
    breed: string;
    category: string;
    isVaccinated: boolean;
    isMicrochipped: boolean;
    images: string[];
    videos?: string[];
    motherName?: string;
    motherImage?: string;
    motherDescription?: string;
    fatherName?: string;
    fatherImage?: string;
    fatherDescription?: string;
};

export default function CatProfile() {
    const { alias } = useParams();
    const { t, i18n } = useTranslation();
    const [cat, setCat] = useState<Cat | null>(null);

    useEffect(() => {
        // Determine which language data to load
        const catsData = i18n.language === 'ro' ? catsRo : catsEn;
        const foundCat = catsData.find((c) => c.alias === alias);
        setCat(foundCat || null);
    }, [alias, i18n.language]);

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

    if (!cat) {
        return (
            <>
                <Header />
                <p className="text-white">{t('cat_profile.cat_not_found')}</p>
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
                            <h2 className="text-2xl lg:text-3xl font-bold mb-4">{t('cat_profile.ready_for_adoption')}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.price')}:</h3>
                                    <p className="text-2xl lg:text-3xl text-blue-500 font-bold mb-4">€{cat.price}</p>

                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.color')}:</h3>
                                    <p className="text-gray-400 mb-4">{cat.color}</p>

                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.gender')}:</h3>
                                    <p className="text-gray-400 mb-4">{cat.gender}</p>

                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.breed')}:</h3>
                                    <p className="text-gray-400 mb-4">{cat.breed}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.category')}:</h3>
                                    <p className="text-gray-400 mb-4">{cat.category}</p>

                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.vaccinated')}:</h3>
                                    <p className="text-gray-400 mb-4">{cat.isVaccinated ? t('yes') : t('no')}</p>

                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.microchipped')}:</h3>
                                    <p className="text-gray-400 mb-4">{cat.isMicrochipped ? t('yes') : t('no')}</p>

                                    <h3 className="text-lg lg:text-xl font-semibold mb-2">{t('cat_profile.contact')}:</h3>
                                    <p className="text-gray-400 mb-4">{t('cat_profile.phone')}: +1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <ParentInfoModal
                                    motherName={cat.motherName || t('cat_profile.unknown_mother')}
                                    motherImage={cat.motherImage || "/default-mother.jpg"}
                                    motherDescription={cat.motherDescription || t('cat_profile.no_description')}
                                    fatherName={cat.fatherName || t('cat_profile.unknown_father')}
                                    fatherImage={cat.fatherImage || "/default-father.jpg"}
                                    fatherDescription={cat.fatherDescription || t('cat_profile.no_description')}
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
                                    layout="fill"
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
                                    <div className="w-[100px] h-[100px] lg:w-[150px] lg:h-[150px]">
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
                                                className="rounded-lg object-cover w-full h-full cursor-pointer"
                                                layout="fill"
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
                            onSlideChange={handleSlideChange}
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
