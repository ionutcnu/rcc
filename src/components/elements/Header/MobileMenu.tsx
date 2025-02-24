'use client';
import {JSXElementConstructor, ReactElement, useState} from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/Utils/firebaseConfig';
import GoogleTranslate from '@/Utils/LanguageSwitcher';

interface NavLink {
    name: string;
    path: string;
    icon: ReactElement<any, string | JSXElementConstructor<any>>;
}

interface MobileMenuProps {
    navLinks: NavLink[];
    isAuthenticated: boolean;
    authActions: ReactElement;
}

export default function MobileMenu({
                                       navLinks,
                                       isAuthenticated,
                                       authActions
                                   }: MobileMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    const menuVariants = {
        hidden: { opacity: 0, x: -100, transition: { duration: 0.5 } },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <>
            {/* Hamburger Button */}
            <div className="md:hidden">
                <button onClick={toggleMenu}>
                    {menuOpen ? (
                        <svg className="h-6 w-6 text-orange-600 hover:text-orange-700" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6 text-orange-600 hover:text-orange-700" viewBox="0 0 24 24">
                            <path
                                d="M4 6h16M4 12h16M4 18h16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={menuVariants}
                    className="md:hidden fixed inset-0 bg-amber-50 bg-opacity-95 z-40 flex flex-col items-center p-4"
                >
                    <button
                        onClick={toggleMenu}
                        className="absolute top-4 right-4 text-orange-600 text-3xl"
                    >
                        ✕
                    </button>
                    <nav className="mt-12 w-full text-center space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className="flex items-center justify-center text-xl text-gray-900 hover:text-orange-700 p-3"
                                onClick={toggleMenu}
                            >
                                {link.icon}
                                <span className="ml-2">{link.name}</span>
                            </Link>
                        ))}

                        <div className="border-t border-orange-200 pt-4">
                            {isAuthenticated ? (
                                authActions
                            ) : (
                                authActions
                            )}
                        </div>

                        <div className="mt-4 border-t border-orange-200 pt-4">
                            <div className="text-orange-600">
                                <GoogleTranslate />
                            </div>
                        </div>
                    </nav>
                </motion.div>
            )}
        </>
    );
}