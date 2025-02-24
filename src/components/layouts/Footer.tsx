import { FaFacebookF, FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import { GiCat, GiPartyPopper, GiPawPrint } from "react-icons/gi";

export default function Footer() {
    return (
        <footer className="bg-amber-50 text-gray-900 p-8 border-t-4 border-orange-200">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                {/* Decorative paw prints */}
                <div className="absolute top-4 right-4 opacity-10">
                    <GiPawPrint className="w-16 h-16 transform rotate-12" />
                </div>

                {/* Brand Section - Your Original Data */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <GiCat className="w-8 h-8 text-orange-600" />
                        <h3 className="text-2xl font-bold font-paw tracking-wide">
                            Red Cat Cuasar
                        </h3>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                            <GiPawPrint className="text-orange-500" />
                            <span>Pitesti</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <GiPawPrint className="text-orange-500" />
                            <a href="mailto:poppsy81@yahoo.com" className="hover:text-orange-700 transition-colors">
                                poppsy81@yahoo.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* CAT Section - Original Links */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GiCat className="text-orange-600" />
                        CAT
                    </h3>
                    <nav className="space-y-2">
                        <a href="/contract" className="block hover:text-orange-700 transition-colors group">
                            <span className="flex items-center gap-1">
                                <GiPawPrint className="text-orange-500 group-hover:animate-bounce" />
                                Contract
                            </span>
                        </a>
                        <a href="/process" className="block hover:text-orange-700 transition-colors group">
                            <span className="flex items-center gap-1">
                                <GiPawPrint className="text-orange-500 group-hover:animate-bounce" />
                                Adoption Process
                            </span>
                        </a>
                        <a href="/conditions" className="block hover:text-orange-700 transition-colors group">
                            <span className="flex items-center gap-1">
                                <GiPawPrint className="text-orange-500 group-hover:animate-bounce" />
                                Living Conditions
                            </span>
                        </a>
                        <a href="/guide" className="block hover:text-orange-700 transition-colors group">
                            <span className="flex items-center gap-1">
                                <GiPawPrint className="text-orange-500 group-hover:animate-bounce" />
                                Post-adoption Guide
                            </span>
                        </a>
                    </nav>
                </div>

                {/* ORGANIZATION Section - Original Data */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GiPartyPopper className="text-orange-600" />
                        ORGANIZATION
                    </h3>
                    <nav className="space-y-2">
                        <a href="/club" className="block hover:text-orange-700 transition-colors group">
                            <span className="flex items-center gap-1">
                                <GiPawPrint className="text-orange-500" />
                                Club
                            </span>
                        </a>
                        <a href="/history" className="block hover:text-orange-700 transition-colors">
                            History
                        </a>
                    </nav>
                </div>

                {/* Social Media - Original Links */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Follow Us</h3>
                    <div className="flex space-x-4">
                        <a href="https://www.facebook.com/profile.php?id=100005346816308"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors">
                            <FaFacebookF className="w-6 h-6" />
                        </a>
                        <a href="https://twitter.com"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors">
                            <FaTwitter className="w-6 h-6" />
                        </a>
                        <a href="https://instagram.com"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors">
                            <FaInstagram className="w-6 h-6" />
                        </a>
                        <a href="https://www.tiktok.com/"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="p-2 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors">
                            <FaTiktok className="w-6 h-6" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Original Copyright */}
            <div className="container mx-auto mt-8 pt-6 border-t border-orange-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p className="flex items-center gap-1">
                        <GiPawPrint className="text-orange-500" />
                        © 2024 www.rcc.org
                    </p>
                    <div className="flex space-x-4">
                        <a href="/privacy" className="hover:text-orange-700">
                            Privacy Policy
                        </a>
                        <a href="/terms" className="hover:text-orange-700">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}