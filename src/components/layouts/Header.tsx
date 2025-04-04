'use client';
import { useState, useEffect, JSXElementConstructor, ReactElement } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GiCat, GiPawPrint, GiHollowCat } from 'react-icons/gi';
import GoogleTranslate from '@/Utils/LanguageSwitcher';
import ProfileDropdown from "@/components/elements/Header/ProfileDropdown";
import MobileMenu from '@/components/elements/Header/MobileMenu';
import { auth } from "@/Utils/firebaseConfig";

interface NavLink {
    name: string;
    path: string;
    icon: ReactElement<any, string | JSXElementConstructor<any>>;
}

export default function Header() {
    const [isSticky, setIsSticky] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsSticky(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        const unsubscribe = auth.onAuthStateChanged(user => {
            setIsAuthenticated(!!user);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            unsubscribe();
        };
    }, []);

    const navLinks: NavLink[] = [
        {
            name: 'Home',
            path: '/',
            icon: <GiPawPrint className="mr-1" />
        },
        {
            name: 'Our Cats',
            path: '/allcats',
            icon: <GiCat className="mr-1" />
        },
        {
            name: 'Contact',
            path: '/contact',
            icon: <GiHollowCat className="mr-1" />
        }
    ];

    return (
        <motion.header
            className={`w-full top-0 z-50 ${
                isSticky
                    ? 'bg-[#F4F6FA] shadow-lg fixed border-b-2 border-[#5C6AC4]'
                    : 'bg-[#F4F6FA]'
            } transition-all duration-300`}
            animate={{ height: isSticky ? "70px" : "90px" }}
        >
            <div className="container mx-auto px-4 flex justify-between items-center h-full">
                {/* Logo Section */}
                <Link href="/" className="flex items-center space-x-3 group">
                    <div className="relative w-12 h-12">
                        <Image
                            src="/logo.svg"
                            alt="Red Cat Cuasar Logo"
                            fill
                            className="object-contain group-hover:rotate-12 transition-transform"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-bold text-[#FF6B6B]">
                        Red Cat Cuasar
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    <nav className="flex space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className="flex items-center text-[#2E2E2E] hover:text-[#FF6B6B] px-3 py-2 rounded-lg transition-colors"
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-4 border-l-2 border-[#d1d5db] pl-4">
                        <div className="text-[#FF6B6B]">
                            <GoogleTranslate />
                        </div>

                        {isAuthenticated ? (
                            <>
                                <ProfileDropdown
                                    icon={<GiCat className="w-6 h-6 text-[#FF6B6B]" />}
                                />
                                <button
                                    onClick={() => auth.signOut()}
                                    className="flex items-center bg-[#FFD9D9] text-[#FF6B6B] px-4 py-2 rounded-full hover:bg-[#FFB8B8] transition-colors"
                                >
                                    <GiPawPrint className="mr-2" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="flex items-center bg-[#FFD9D9] text-[#FF6B6B] px-4 py-2 rounded-full hover:bg-[#FFB8B8] transition-colors"
                                >
                                    <GiPawPrint className="mr-2" />
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center bg-[#5C6AC4] text-white px-4 py-2 rounded-full hover:bg-[#3F4EB3] transition-colors"
                                >
                                    <GiCat className="mr-2" />
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <MobileMenu
                    navLinks={navLinks}
                    isAuthenticated={isAuthenticated}
                    authActions={
                        isAuthenticated ? (
                            <button
                                onClick={() => auth.signOut()}
                                className="flex items-center justify-center text-xl text-[#2E2E2E] hover:text-[#FF6B6B] p-3"
                            >
                                <GiPawPrint className="mr-2" />
                                Logout
                            </button>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center text-xl text-[#2E2E2E] hover:text-[#FF6B6B] p-3"
                                >
                                    <GiPawPrint className="mr-2" />
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center justify-center text-xl text-[#2E2E2E] hover:text-[#FF6B6B] p-3"
                                >
                                    <GiCat className="mr-2" />
                                    Register
                                </Link>
                            </>
                        )
                    }
                />
            </div>
        </motion.header>
    );
}
