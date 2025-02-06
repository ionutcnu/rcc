import {FaFacebookF, FaTwitter, FaInstagram, FaTiktok} from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="bg-gray-200 text-black p-6">
            <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <h3 className="text-lg font-semibold">Red Cat Cuasar</h3>
                    <p>Official Location:</p>
                    <p>Pitesti</p>
                    <p>Email: poppsy81@yahoo.com</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">CAT</h3>
                    <ul className="space-y-1">

                        <li>
                            <a href="/contract"  className="hover:text-gray-400">
                                Contract
                            </a>
                        </li>
                        <li>Adoption Process</li>
                        <li>Living Conditions</li>
                        <li>Post-adoption Guide</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">ORGANIZATION</h3>
                    <ul className="space-y-1">
                        <li>
                            <a href={"/club"} className='hover:text-gray-400'>
                                Club
                            </a>
                        </li>
                        <li>History</li>
                    </ul>
                </div>
                <div>
                </div>
            </div>
<div className="mt-4 flex justify-between items-left">
    <p>&copy; 2024 www.rcc.org</p>
    <div className="flex space-x-4">
        <a href="https://www.facebook.com/profile.php?id=100005346816308" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaFacebookF />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaTwitter />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaInstagram />
        </a>
        <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
            <FaTiktok />
        </a>
    </div>
</div>
        </footer>
    );
}
