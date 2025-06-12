"use client"

import { type JSXElementConstructor, type ReactElement, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GiPawPrint, GiExitDoor } from "react-icons/gi"
import { MdOutlineDashboard } from "react-icons/md"
import { HiMenu, HiX } from "react-icons/hi"
import LanguageSwitcher from "./LanguageSwitcher"
import { useAuth } from "@/lib/auth/auth-context"
import { useTranslationSettings } from "@/lib/hooks/useTranslationSettings"

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
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const router = useRouter()
    const { user, logout } = useAuth()
    const { isEnabled: translationsEnabled } = useTranslationSettings()

    // Get current user email when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            setUserEmail(user.email)
        } else {
            setUserEmail(null)
        }
    }, [isAuthenticated, user])

    // Close menu when clicking outside or on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }

        if (menuOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [menuOpen])

    const menuVariants = {
        hidden: {
            opacity: 0,
            x: "100%",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        },
        visible: {
            opacity: 1,
            x: "0%",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40,
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    }

    const overlayVariants = {
        hidden: {
            opacity: 0,
            transition: {
                duration: 0.3
            }
        },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3
            }
        }
    }

    const itemVariants = {
        hidden: {
            opacity: 0,
            x: 50,
            transition: {
                duration: 0.2
            }
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        }
    }

    const buttonVariants = {
        closed: { rotate: 0 },
        open: { rotate: 180 }
    }

    const toggleMenu = () => setMenuOpen(!menuOpen)

    const handleLogout = async () => {
        try {
            await logout()
            setMenuOpen(false)
        } catch (error) {
            console.error("Logout error:", error)
        }
    }

    return (
      <>
          {/* Hamburger Button */}
          <div className="md:hidden">
              <motion.button
                onClick={toggleMenu}
                className="relative p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={menuOpen ? "open" : "closed"}
                aria-label="Toggle menu"
                style={{
                  zIndex: 10000
                }}
              >
                  <motion.div
                    variants={buttonVariants}
                    transition={{ duration: 0.3 }}
                  >
                      {menuOpen ? (
                        <HiX className="w-6 h-6 text-red-500" />
                      ) : (
                        <HiMenu className="w-6 h-6 text-gray-700" />
                      )}
                  </motion.div>
              </motion.button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
              {menuOpen && (
                <>
                    {/* Backdrop Overlay */}
                    <motion.div
                      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                      variants={overlayVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      onClick={toggleMenu}
                      style={{
                        zIndex: 9998,
                        position: 'fixed'
                      }}
                    />

                    {/* Mobile Menu Panel */}
                    <motion.div
                      className="flex flex-col w-80 max-w-[85vw]"
                      variants={menuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        height: '100vh',
                        minHeight: '100vh',
                        maxHeight: '100vh',
                        zIndex: 9999,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                      }}
                    >
                        {/* Header */}
                        <motion.div
                          className="flex items-center justify-between p-6 border-b border-gray-100"
                          variants={itemVariants}
                        >
                            <motion.h2
                              className="text-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                                Menu
                            </motion.h2>
                            <motion.button
                              onClick={toggleMenu}
                              className="p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              aria-label="Close menu"
                            >
                                <HiX className="w-5 h-5 text-red-500" />
                            </motion.button>
                        </motion.div>

                        {/* Navigation Links */}
                        <motion.nav
                          className="flex-1 px-6 py-4 space-y-2"
                          variants={itemVariants}
                        >
                            {navLinks.map((link, index) => (
                              <motion.div
                                key={link.path}
                                variants={itemVariants}
                                custom={index}
                                onMouseEnter={() => setHoveredItem(link.path)}
                                onMouseLeave={() => setHoveredItem(null)}
                              >
                                  <Link
                                    href={link.path}
                                    onClick={toggleMenu}
                                    className="group flex items-center w-full p-4 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 font-medium"
                                  >
                                      <motion.div
                                        className="flex items-center w-full"
                                        whileHover={{ x: 5 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                      >
                                          <motion.div
                                            className="mr-4 p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300"
                                            animate={{
                                                rotate: hoveredItem === link.path ? 360 : 0,
                                                scale: hoveredItem === link.path ? 1.1 : 1
                                            }}
                                            transition={{ duration: 0.5 }}
                                          >
                                              {link.icon}
                                          </motion.div>
                                          <span className="text-lg">{link.name}</span>
                                      </motion.div>

                                      <motion.div
                                        className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: hoveredItem === link.path ? 1 : 0 }}
                                      />
                                  </Link>
                              </motion.div>
                            ))}
                        </motion.nav>

                        {/* Divider */}
                        <motion.div
                          className="mx-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                          variants={itemVariants}
                        />

                        {/* Authentication Section */}
                        <motion.div
                          className="px-6 py-4 space-y-3"
                          variants={itemVariants}
                        >
                            {isAuthenticated ? (
                              <div className="space-y-3">
                                  {/* Admin Dashboard Link */}
                                  <motion.div variants={itemVariants}>
                                      <Link
                                        href="/admin"
                                        onClick={toggleMenu}
                                        className="group flex items-center w-full p-4 rounded-xl text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 font-medium"
                                      >
                                          <motion.div
                                            className="flex items-center w-full"
                                            whileHover={{ x: 5 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                          >
                                              <motion.div
                                                className="mr-4 p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300"
                                                whileHover={{ rotate: 360, scale: 1.1 }}
                                                transition={{ duration: 0.5 }}
                                              >
                                                  <MdOutlineDashboard className="w-5 h-5 text-purple-600" />
                                              </motion.div>
                                              <span className="text-lg">Admin Dashboard</span>
                                          </motion.div>
                                      </Link>
                                  </motion.div>

                                  {/* User Email Display */}
                                  {userEmail && (
                                    <motion.div
                                      className="flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100"
                                      variants={itemVariants}
                                    >
                                        <motion.div
                                          animate={{ rotate: [0, 15, -15, 0] }}
                                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                        >
                                            <GiPawPrint className="mr-2 w-4 h-4 text-green-600" />
                                        </motion.div>
                                        <span className="text-sm text-green-700 font-medium">{userEmail}</span>
                                    </motion.div>
                                  )}

                                  {/* Logout Button */}
                                  <motion.div variants={itemVariants}>
                                      <motion.button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center w-full p-4 rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:from-red-200 hover:to-pink-200 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                          <motion.div
                                            animate={{ rotate: [0, 15, -15, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                          >
                                              <GiExitDoor className="mr-3 w-5 h-5" />
                                          </motion.div>
                                          <span className="text-lg">Logout</span>
                                      </motion.button>
                                  </motion.div>
                              </div>
                            ) : (
                              <motion.div variants={itemVariants}>
                                  <Link
                                    href="/login"
                                    onClick={toggleMenu}
                                    className="flex items-center justify-center w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                                  >
                                      <motion.div
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center"
                                      >
                                          <motion.div
                                            animate={{ rotate: [0, 15, -15, 0] }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                          >
                                              <GiPawPrint className="mr-3 w-5 h-5" />
                                          </motion.div>
                                          <span className="text-lg">Login</span>
                                      </motion.div>
                                  </Link>
                              </motion.div>
                            )}
                        </motion.div>

                        {/* Language Switcher */}
                        {translationsEnabled && (
                          <motion.div
                            className="px-6 py-4 border-t border-gray-100 flex justify-center"
                            variants={itemVariants}
                          >
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                  <LanguageSwitcher />
                              </motion.div>
                          </motion.div>
                        )}
                    </motion.div>
                </>
              )}
          </AnimatePresence>
      </>
    )
}