'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAllCats } from '@/lib/client/catClient';
import type { CatProfile } from '@/lib/types/cat';
import { getTimestampValue } from '@/lib/types/timestamp';
import { GiCat, GiPawPrint } from 'react-icons/gi';
import type SwiperCore from 'swiper';
import Particles from './Particles';

export default function CatsSection() {
  const swiperRef = useRef<SwiperCore>();
  const [cats, setCats] = useState<CatProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching cats for CatsSection...');
        // Fetch cats from API
        const fetchedCats = await fetchAllCats(false); // false means don't include deleted cats
        console.log('Fetched cats for CatsSection:', fetchedCats);

        // Check if fetchedCats is valid
        if (!Array.isArray(fetchedCats)) {
          console.error('fetchedCats is not an array:', fetchedCats);
          setCats([]);
          return;
        }

        if (fetchedCats.length === 0) {
          console.log('No cats returned from API');
          setCats([]);
          return;
        }

        // Sort cats by createdAt date in descending order (newest first)
        const sortedCats = fetchedCats.sort((a, b) => {
          // Use our utility function to get timestamp values
          return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
        });

        setCats(sortedCats);
      } catch (err) {
        console.error('Error fetching cats for CatsSection:', err);
        setError('Failed to load cats. Please try again later.');
        setCats([]); // Ensure cats is an empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchCats();
  }, []);

  return (
    <section className="relative bg-[#1C1C21] py-16 text-white">
      <Particles className="absolute inset-0 z-0" quantity={100} staticity={10} ease={50} />
      <div className="container relative z-10 mx-auto text-center">
        <h2 className="mb-4 text-4xl font-semibold">Meet Our British Shorthairs</h2>
        <p className="mb-12 text-xl">Discover our premium British Shorthair cats available for loving homes</p>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-500 bg-opacity-20 p-4">
            <p>{error}</p>
          </div>
        ) : cats.length === 0 ? (
          <div className="rounded-lg bg-yellow-500 bg-opacity-20 p-4">
            <p>No cats available at the moment. Check back soon!</p>
          </div>
        ) : (
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2
              },
              1024: {
                slidesPerView: 3
              }
            }}
            pagination={{ clickable: true }}
            className="h-full w-full"
          >
            {cats.slice(0, 6).map((cat) => (
              <SwiperSlide key={cat.id}>
                <Link href={`/cat-profile/${encodeURIComponent(cat.name)}`}>
                  <div className="cat-card cat-hover-lift group h-full cursor-pointer">
                    <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                      <Image
                        src={cat.mainImage || '/placeholder-cat.jpg'}
                        alt={cat.name}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                      {/* Floating paw prints on hover */}
                      <div className="absolute right-4 top-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <GiPawPrint className="animate-paw-wave h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="p-6 text-gray-800">
                      <div className="mb-2 flex items-center">
                        <GiCat className="mr-2 h-5 w-5 text-red-500" />
                        <h3 className="cat-text-gradient-warm text-2xl font-bold transition-transform duration-300 group-hover:scale-105">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="mb-4 line-clamp-2 text-gray-700">
                        {cat.description || `${cat.breed} - ${cat.gender}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center text-sm text-gray-500">
                          <GiPawPrint className="mr-1 h-3 w-3 text-pink-500" />
                          {cat.yearOfBirth ? `Born ${cat.yearOfBirth}` : 'Age unknown'}
                        </span>
                        {cat.availability && (
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              cat.availability === 'Available'
                                ? 'bg-green-100 text-green-800'
                                : cat.availability === 'Reserved'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cat.availability}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Navigation buttons */}
        {!isLoading && cats.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              className="text-alabaster-600 bg-alabaster-900 hover:bg-seance-700 border-alabaster-900 flex h-12 w-12 items-center justify-center rounded-full border"
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="text-alabaster-600 bg-alabaster-900 hover:bg-seance-700 border-alabaster-900 ml-4 flex h-12 w-12 items-center justify-center rounded-full border"
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next slide"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <p className="mt-12 text-lg">Our beautiful cats are looking for their perfect match and loving families.</p>
        <p className="text-lg">Each cat is health-checked and ready to find their forever home!</p>
        <a href="/allcats" className="mt-4 inline-block text-lg text-yellow-500 hover:underline">
          See all cats &gt;
        </a>
      </div>
    </section>
  );
}
