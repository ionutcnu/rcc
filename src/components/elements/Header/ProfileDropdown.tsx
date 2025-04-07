'use client';
import { useState, ReactElement } from 'react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { useRouter } from 'next/navigation';
import { GiCat, GiPawPrint, GiExitDoor } from 'react-icons/gi';
import Link from "next/link";

interface ProfileDropdownProps {
    icon: ReactElement;
}

export default function ProfileDropdown({ icon }: ProfileDropdownProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
        setMenuOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            {/* Profile Icon and Dropdown Trigger */}
            <div>
                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center space-x-2 bg-orange-100 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 hover:bg-orange-200 transition-colors"
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                >
                    <span className="sr-only">Open profile menu</span>
                    {icon}
                    <span className="text-sm font-medium text-orange-700">Cat Profile</span>
                </button>
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg shadow-xl bg-amber-50 border border-orange-200 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                >
                    <div className="py-2 px-1" role="none">
                        {/* Profile Link */}
                        <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-gray-900 hover:bg-orange-100 rounded-md transition-colors"
                            role="menuitem"
                            onClick={() => setMenuOpen(false)}
                        >
                            <GiCat className="w-5 h-5 mr-2 text-orange-600" />
                            My Profile
                        </Link>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2 text-gray-900 hover:bg-orange-100 rounded-md transition-colors"
                            role="menuitem"
                        >
                            <GiExitDoor className="w-5 h-5 mr-2 text-orange-600" />
                            Log out
                        </button>

                        {/* Current User Info */}
                        <div className="mt-2 pt-2 border-t border-orange-200">
                            <div className="px-4 py-2 text-xs text-orange-600">
                                {auth.currentUser?.email && (
                                    <div className="flex items-center">
                                        <GiPawPrint className="mr-1.5" />
                                        {auth.currentUser.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}