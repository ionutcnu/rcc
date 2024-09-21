// components/layouts/Footer.tsx

'use client';
import { FaFacebookF, FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-gray-200 text-black p-6">
            <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <h3 className="text-lg font-semibold">{t('footer.title')}</h3>
                    <p>{t('footer.official_location')}</p>
                    <p>{t('footer.pitesti')}</p>
                    <p>{t('footer.email')}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">{t('footer.cat')}</h3>
                    <ul className="space-y-1">
                        <li>{t('footer.for_adoption')}</li>
                        <li>{t('footer.adoption_process')}</li>
                        <li>{t('footer.living_conditions')}</li>
                        <li>{t('footer.post_adoption_guide')}</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">{t('footer.organization')}</h3>
                    <ul className="space-y-1">
                        <li>{t('footer.the_team')}</li>
                        <li>{t('footer.history')}</li>
                    </ul>
                </div>
                <div>
                    {/* Additional content if any */}
                </div>
            </div>
            <div className="mt-4 flex justify-between items-left">
                <p>{t('footer.copyright')}</p>
                <div className="flex space-x-4">
                    <a
                        href="https://www.facebook.com/profile.php?id=100005346816308"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-400"
                    >
                        <FaFacebookF />
                    </a>
                    <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-400"
                    >
                        <FaTwitter />
                    </a>
                    <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-400"
                    >
                        <FaInstagram />
                    </a>
                    <a
                        href="https://www.tiktok.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-400"
                    >
                        <FaTiktok />
                    </a>
                </div>
            </div>
        </footer>
    );
}
