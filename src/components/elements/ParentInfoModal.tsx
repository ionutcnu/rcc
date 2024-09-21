import { useState } from 'react';
import Image from 'next/image';
import { FaTree } from 'react-icons/fa'; // Tree icon
import { useTranslation } from 'react-i18next'; // Import translation hook

type ParentInfoModalProps = {
    motherName: string;
    motherImage: string;
    motherDescription: string;
    fatherName: string;
    fatherImage: string;
    fatherDescription: string;
};

const ParentInfoModal: React.FC<ParentInfoModalProps> = ({
                                                             motherName,
                                                             motherImage,
                                                             motherDescription,
                                                             fatherName,
                                                             fatherImage,
                                                             fatherDescription,
                                                         }) => {
    const { t } = useTranslation(); // Initialize translation
    const [isOpen, setIsOpen] = useState(false);

    const togglePopup = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Tree Icon to trigger popup */}
            <button onClick={togglePopup} className="text-blue-500 flex items-center">
                <FaTree className="mr-2" /> {t('parent_info.show_tree')}
            </button>

            {/* Popup content */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="relative bg-white p-4 md:p-8 rounded-lg max-w-md w-full md:max-w-3xl shadow-lg">
                        {/* Close Button */}
                        <button
                            onClick={togglePopup}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl"
                        >
                            &times;
                        </button>

                        {/* Mother and Father Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Mother Section */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-[150px] h-[150px] md:w-[180px] md:h-[180px] lg:w-[220px] lg:h-[220px] overflow-hidden rounded-lg mb-4">
                                    <Image
                                        src={motherImage}
                                        alt={motherName}
                                        width={220}
                                        height={220}
                                        className="rounded-lg object-cover"
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    {motherName || t('parent_info.unknown_mother')}
                                </h3>
                                <p className="text-gray-700 mt-2">
                                    {motherDescription || t('parent_info.no_description')}
                                </p>
                            </div>

                            {/* Father Section */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-[150px] h-[150px] md:w-[180px] md:h-[180px] lg:w-[220px] lg:h-[220px] overflow-hidden rounded-lg mb-4">
                                    <Image
                                        src={fatherImage}
                                        alt={fatherName}
                                        width={220}
                                        height={220}
                                        className="rounded-lg object-cover"
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-black">
                                    {fatherName || t('parent_info.unknown_father')}
                                </h3>
                                <p className="text-gray-700 mt-2">
                                    {fatherDescription || t('parent_info.no_description')}
                                </p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={togglePopup}
                            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                        >
                            {t('parent_info.close')}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ParentInfoModal;
