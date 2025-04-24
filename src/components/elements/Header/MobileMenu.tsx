"use client"

import { type JSXElementConstructor, type ReactElement, useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebaseConfig"
import { GiPawPrint, GiExitDoor } from "react-icons/gi"
import { MdOutlineDashboard } from "react-icons/md"
import LanguageSwitcher from "./LanguageSwitcher"

interface NavLink {
    name: string
    path: string
    icon: ReactElement<any, string | JSXElementConstructor<any>>
}

interface MobileMenuProps {
    navLinks: NavLink[]
    isAuthenticated: boolean
    authActions: ReactElement
}

export default function MobileMenu({ navLinks, isAuthenticated, authActions }: MobileMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const router = useRouter()

    // Get current user email when authenticated
    useEffect(() => {
        if (isAuthenticated && auth.currentUser) {
            setUserEmail(auth.currentUser.email)
        } else {
            setUserEmail(null)
        }
    }, [isAuthenticated])

    const menuVariants = {
        hidden: { opacity: 0, x: -100, transition: { duration: 0.5 } },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    }

    const toggleMenu = () => setMenuOpen(!menuOpen)

    const handleLogout = async () => {
        try {
            // Sign out from Firebase client
            await auth.signOut()

            // Call server API to revoke session cookie
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            })

            // Force a full page reload to clear any cached state
            window.location.href = "/"
        } catch (error) {
            console.error("Logout error:", error)
            window.location.href = "/"
        }
    }

    return (
        <>
            {/* Hamburger Button */}
            <div className="md:hidden">
                <button onClick={toggleMenu} aria-label="Toggle menu">
                    {menuOpen ? (
                        <svg className="h-6 w-6 text-orange-600 hover:text-orange-700" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6 text-orange-600 hover:text-orange-700" viewBox="0 0 24 24">
                            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
                        aria-label="Close menu"
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
                                <div className="space-y-4">
                                    {/* Admin Dashboard Link */}
                                    <Link
                                        href="/admin"
                                        className="flex items-center justify-center text-xl text-gray-900 hover:text-orange-700 p-3"
                                        onClick={toggleMenu}
                                    >
                                        <MdOutlineDashboard className="text-orange-600" />
                                        <span className="ml-2">Admin Dashboard</span>
                                    </Link>

                                    {/* Logout Button */}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center w-full text-xl text-gray-900 hover:text-orange-700 p-3"
                                    >
                                        <GiExitDoor className="text-orange-600" />
                                        <span className="ml-2">Logout</span>
                                    </button>

                                    {/* User Email Display */}
                                    {userEmail && (
                                        <div className="flex items-center justify-center text-sm text-orange-600 p-2 mt-2">
                                            <GiPawPrint className="mr-1.5" />
                                            {userEmail}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center text-xl text-gray-900 hover:text-orange-700 p-3"
                                        onClick={toggleMenu}
                                    >
                                        <GiPawPrint className="mr-2" />
                                        Login
                                    </Link>
                                    {/* Registration link commented out - can be re-enabled in the future
                  <Link
                    href="/register"
                    className="flex items-center justify-center text-xl text-gray-900 hover:text-orange-700 p-3"
                    onClick={toggleMenu}
                  >
                    <GiCat className="mr-2" />
                    Register
                  </Link>
                  */}
                                </>
                            )}
                        </div>

                        <div className="mt-4 border-t border-orange-200 pt-4 flex justify-center">
                            <LanguageSwitcher />
                        </div>
                    </nav>
                </motion.div>
            )}
        </>
    )
}
