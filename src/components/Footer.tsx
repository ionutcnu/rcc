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
            <div className="mt-4 flex justify-between items-center">
                <p>&copy; 2024 www.rcc.org</p>
                <div className="space-x-4">
                    <a href="#" className="hover:text-gray-400">Facebook</a>
                    <a href="#" className="hover:text-gray-400">Twitter</a>
                    <a href="#" className="hover:text-gray-400">Instagram</a>
                </div>


            </div>
        </footer>
    );
}
