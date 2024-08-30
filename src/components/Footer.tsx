import {FaFacebookF, FaTwitter, FaInstagram, FaTiktok} from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="bg-gray-200 text-black p-6">
            <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <h3 className="text-lg font-semibold">SOFAHELDEN</h3>
                    <p>Official Location:</p>
                    <p>Hohenzollernring 18c, 13585 Berlin</p>
                    <p>Email: info@sofahelden.org</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">CAT</h3>
                    <ul className="space-y-1">
                        <li>For Adoption</li>
                        <li>Adoption Process</li>
                        <li>Cat Diseases</li>
                        <li>Living Conditions</li>
                        <li>Happy Ends</li>
                        <li>Post-adoption Guide</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">ORGANIZATION</h3>
                    <ul className="space-y-1">
                        <li>The Team</li>
                        <li>History</li>
                        <li>Philosophy</li>
                        <li>Mission</li>
                        <li>Imprint</li>
                        <li>Data Protection</li>
                        <li>Partners</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">SUPPORT</h3>
                    <ul className="space-y-1">
                        <li>Membership</li>
                        <li>Donate</li>
                        <li>FAQs</li>
                        <li>News</li>
                    </ul>
                </div>
            </div>
<div className="mt-4 flex justify-between items-left">
    <p>&copy; 2024 www.rcc.org</p>
    <div className="flex space-x-4">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaFacebookF />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaTwitter />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaInstagram />
        </a>
        <a href="https://tiktock.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaTiktok />
        </a>
    </div>
</div>
        </footer>
    );
}
