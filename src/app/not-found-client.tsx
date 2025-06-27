"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layouts/Header'
import Footer from '@/components/layouts/Footer'
import { Button } from '@/components/ui/button'
import { GiCat, GiPawPrint } from "react-icons/gi"
import { FaHome, FaHeart, FaPhone, FaArrowLeft } from "react-icons/fa"

export default function NotFoundClient() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 relative overflow-hidden">
            {/* Floating Cat Elements */}
            <div className="cat-float top-20 left-10 cat-float-delayed">
                <GiCat className="w-16 h-16 text-orange-300/40" />
            </div>
            <div className="cat-float top-40 right-20 cat-float-slow">
                <GiPawPrint className="w-12 h-12 text-red-300/40" />
            </div>
            <div className="cat-float bottom-40 left-1/4">
                <GiCat className="w-20 h-20 text-pink-300/40" />
            </div>
            <div className="cat-float bottom-20 right-1/3 cat-float-delayed">
                <GiPawPrint className="w-14 h-14 text-blue-300/40" />
            </div>

            <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Header />
                
                <main className="container mx-auto px-4 py-16 text-center min-h-[70vh] flex items-center justify-center">
                    <div className="max-w-2xl mx-auto">
                        {/* 404 Hero Section */}
                        <div className="mb-8">
                            <div className="text-8xl md:text-9xl font-bold text-gray-200 mb-4">
                                404
                            </div>
                            <div className="relative -mt-16 mb-8">
                                <GiCat className="w-24 h-24 md:w-32 md:h-32 text-orange-500 mx-auto animate-bounce" />
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                                Oops! This Cat Wandered Off
                            </h1>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                It looks like this page has disappeared like a sneaky cat! 
                                Don't worry though - we have plenty of adorable British Shorthairs 
                                waiting to meet you.
                            </p>
                            
                            {/* Fun Cat Facts */}
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-orange-800">
                                    <strong>Did you know?</strong> Cats spend 70% of their lives sleeping. 
                                    Maybe this page is just taking a cat nap! 😸
                                </p>
                            </div>
                        </div>

                        {/* Navigation Options */}
                        <div className="grid md:grid-cols-2 gap-4 mb-8">
                            <Link href="/cats">
                                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                                    <GiCat className="w-5 h-5 mr-2" />
                                    Browse Available Cats
                                </Button>
                            </Link>
                            
                            <Link href="/">
                                <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105">
                                    <FaHome className="w-4 h-4 mr-2" />
                                    Go Home
                                </Button>
                            </Link>
                        </div>

                        {/* Additional Links */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Link href="/contact">
                                <div className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer">
                                    <FaPhone className="w-6 h-6 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-medium text-gray-800">Contact Us</p>
                                    <p className="text-xs text-gray-600">Get in touch</p>
                                </div>
                            </Link>
                            
                            <Link href="/allcats">
                                <div className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group cursor-pointer">
                                    <FaHeart className="w-6 h-6 text-red-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-sm font-medium text-gray-800">All Cats</p>
                                    <p className="text-xs text-gray-600">See our family</p>
                                </div>
                            </Link>
                            
                            <button 
                                onClick={() => window.history.back()}
                                className="bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group"
                            >
                                <FaArrowLeft className="w-6 h-6 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                <p className="text-sm font-medium text-gray-800">Go Back</p>
                                <p className="text-xs text-gray-600">Previous page</p>
                            </button>
                        </div>

                        {/* Search Suggestion */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-600 mb-4">
                                Looking for something specific? Try searching for:
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {['British Shorthair', 'Kittens', 'Adoption', 'Contact', 'About'].map((term) => (
                                    <Link 
                                        key={term}
                                        href={`/cats?search=${encodeURIComponent(term.toLowerCase())}`}
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    )
}