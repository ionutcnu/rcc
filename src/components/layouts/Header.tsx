"use client"
import { useState, useEffect, type JSXElementConstructor, type ReactElement } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { GiCat, GiPawPrint, GiHollowCat } from "react-icons/gi"
import ProfileDropdown from "@/components/elements/Header/ProfileDropdown"
import MobileMenu from "@/components/elements/Header/MobileMenu"
// import LanguageSwitcher from "@/components/elements/Header/LanguageSwitcher"
import { useAuth } from "@/lib/auth/auth-context"
// import { useTranslationSettings } from "@/lib/hooks/useTranslationSettings"

interface NavLink {
    name: string
    path: string
    icon: ReactElement<any, string | JSXElementConstructor<any>>
}

export default function Header() {
    const [isSticky, setIsSticky] = useState(false)
    const [hoveredLink, setHoveredLink] = useState<string | null>(null)
    const { user, loading, logout } = useAuth()
    // const { isEnabled: translationsEnabled } = useTranslationSettings()

    const isAuthenticated = !loading && !!user

    useEffect(() => {
        const handleScroll = () => setIsSticky(window.scrollY > 50)
        window.addEventListener("scroll", handleScroll)

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    const handleLogout = async () => {
        try {
            // Just call the logout function from the auth context
            // It will handle clearing the state and redirecting
            await logout()
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    const navLinks: NavLink[] = [
        {
            name: "Home",
            path: "/",
            icon: <GiPawPrint className="mr-2 w-5 h-5" />,
        },
        {
            name: "Our Cats",
            path: "/allcats",
            icon: <GiCat className="mr-2 w-5 h-5" />,
        },
        {
            name: "Contact",
            path: "/contact",
            icon: <GiHollowCat className="mr-2 w-5 h-5" />,
        },
    ]

    const containerVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    }

    const logoVariants = {
        hover: {
            rotate: 12,
            scale: 1.05,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 10
            }
        }
    }

    return (
      <motion.header
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`w-full top-0 z-50 transition-all duration-500 ease-in-out ${
          isSticky
            ? "bg-white/95 backdrop-blur-md shadow-xl border-b border-blue-100 fixed"
            : "bg-gradient-to-r from-blue-50 to-purple-50"
        }`}
      >
          <motion.div
            className="container mx-auto px-6 flex justify-between items-center"
            animate={{ height: isSticky ? "70px" : "90px" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
              {/* Logo Section */}
              <motion.div variants={itemVariants}>
                  <Link href="/" className="flex items-center space-x-3 group">
                      <motion.div
                        className="relative w-12 h-12"
                        whileHover="hover"
                        variants={logoVariants}
                      >
                          <Image
                            src="/logo.svg"
                            alt="Red Cat Cuasar Logo"
                            fill
                            className="object-contain drop-shadow-md"
                            priority
                          />
                      </motion.div>
                      <motion.span
                        className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                          Red Cat Cuasar
                      </motion.span>
                  </Link>
              </motion.div>

              {/* Desktop Navigation */}
              <motion.div
                className="hidden md:flex items-center space-x-8"
                variants={itemVariants}
              >
                  <nav className="flex space-x-2">
                      {navLinks.map((link, index) => (
                        <motion.div
                          key={link.path}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          onMouseEnter={() => setHoveredLink(link.path)}
                          onMouseLeave={() => setHoveredLink(null)}
                        >
                            <Link
                              href={link.path}
                              className="relative flex items-center text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl transition-all duration-300 font-medium"
                            >
                                <motion.div
                                  className="flex items-center"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                    <motion.div
                                      animate={{
                                          rotate: hoveredLink === link.path ? 360 : 0,
                                          scale: hoveredLink === link.path ? 1.2 : 1
                                      }}
                                      transition={{ duration: 0.3 }}
                                    >
                                        {link.icon}
                                    </motion.div>
                                    {link.name}
                                </motion.div>

                                {/* Hover background */}
                                <AnimatePresence>
                                    {hoveredLink === link.path && (
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl -z-10"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                      />
                                    )}
                                </AnimatePresence>
                            </Link>
                        </motion.div>
                      ))}
                  </nav>

                  <motion.div
                    className="flex items-center space-x-4 border-l border-gray-200 pl-6"
                    variants={itemVariants}
                  >
                      {/* Language Switcher - Added before authentication controls */}
                      {/* {translationsEnabled && <LanguageSwitcher />} */}

                      <AnimatePresence mode="wait">
                          {loading ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center space-x-2"
                            >
                                <div className="w-32 h-11 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-full"></div>
                            </motion.div>
                          ) : user ? (
                            <motion.div
                              key="authenticated"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center space-x-3"
                            >
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                    <ProfileDropdown icon={<GiCat className="w-6 h-6 text-red-500" />} />
                                </motion.div>
                                <motion.button
                                  onClick={handleLogout}
                                  className="flex items-center bg-gradient-to-r from-red-100 to-pink-100 text-red-600 px-6 py-2.5 rounded-full hover:from-red-200 hover:to-pink-200 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                  whileHover={{ scale: 1.05, y: -1 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                    <motion.div
                                      animate={{ rotate: [0, 15, -15, 0] }}
                                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                    >
                                        <GiPawPrint className="mr-2 w-4 h-4" />
                                    </motion.div>
                                    Logout
                                </motion.button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="unauthenticated"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                            >
                                <Link
                                  href="/login"
                                  className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                >
                                    <motion.div
                                      whileHover={{ scale: 1.05, y: -1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="flex items-center"
                                    >
                                        <motion.div
                                          animate={{ rotate: [0, 15, -15, 0] }}
                                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                        >
                                            <GiPawPrint className="mr-2 w-4 h-4" />
                                        </motion.div>
                                        Login
                                    </motion.div>
                                </Link>
                            </motion.div>
                          )}
                      </AnimatePresence>
                  </motion.div>
              </motion.div>

              <motion.div variants={itemVariants}>
                  <MobileMenu
                    navLinks={navLinks}
                    isAuthenticated={isAuthenticated}
                    authActions={
                        <AnimatePresence mode="wait">
                            {loading ? (
                              <motion.div
                                key="mobile-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-12 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-full"
                              />
                            ) : user ? (
                              <motion.button
                                key="mobile-logout"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onClick={handleLogout}
                                className="flex items-center justify-center text-xl text-gray-700 hover:text-red-600 p-3 rounded-lg hover:bg-red-50 transition-all duration-300 w-full"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                  <GiPawPrint className="mr-2 w-5 h-5" />
                                  Logout
                              </motion.button>
                            ) : (
                              <motion.div
                                key="mobile-login"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                              >
                                  <Link
                                    href="/login"
                                    className="flex items-center justify-center text-xl text-gray-700 hover:text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-all duration-300 w-full"
                                  >
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center"
                                      >
                                          <GiPawPrint className="mr-2 w-5 h-5" />
                                          Login
                                      </motion.div>
                                  </Link>
                              </motion.div>
                            )}
                        </AnimatePresence>
                    }
                  />
              </motion.div>
          </motion.div>
      </motion.header>
    )
}