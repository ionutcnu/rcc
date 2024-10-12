'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GoogleTranslate from '@/Utils/LanguageSwitcher';
import ProfileDropdown from "@/components/elements/Header/ProfileDropdown";
import MobileMenu from '@/components/elements/Header/MobileMenu';
import {auth} from "@/Utils/firebaseConfig";


export default function Header() {
    const [isSticky, setIsSticky] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Sticky header logic
        const handleScroll = () => {
            setIsSticky(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        // Authentication state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            unsubscribe();
        };
    }, []);

    return (
        <motion.header
            className={`p-2 w-full top-0 z-50 ${
                isSticky ? 'bg-gray-200 text-black fixed' : 'bg-gray-200 text-black'
            } transition-all ease-in-out duration-300`}
            animate={{ height: isSticky ? 60 : 60 }}
        >
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="text-2xl font-bold flex items-center">
                    <img
                        src="/logo.svg"
                        alt="RCC Logo"
                        className={`inline-block mr-3 h-10 w-10`}
                    />
                    <Link href="/">RCC</Link>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-6">
                    <nav className="flex space-x-6">
                        <Link href="/" className="hover:text-gray-500">
                            Home
                        </Link>
                        <Link href="/cats" className="hover:text-gray-500">
                            Cats
                        </Link>
                        <Link href="/contact" className="hover:text-gray-500">
                            Contact
                        </Link>
                    </nav>

                    {/* Google Translate Component */}
                    <div>
                        <GoogleTranslate />
                    </div>

                    {/* Authentication Buttons */}
                    {isAuthenticated ? (
                        <>
                            <ProfileDropdown />
                            <button
                                onClick={() => {
                                    auth.signOut().then(() => {
                                        setIsAuthenticated(false);
                                    });
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                            >
                                Logout
                            </button>
                        </>

                    ) : (
                        <>
                            <Link href="/login">
                                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                                    Login
                                </button>
                            </Link>
                            <Link href="/register">
                                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                                    Register
                                </button>
                            </Link>
                        </>
                    )}
                </div>



                {/* Mobile Menu */}
                <MobileMenu />
            </div>
        </motion.header>
    );
}
