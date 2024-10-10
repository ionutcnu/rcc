'use client';

import React, { useEffect } from 'react';


const GoogleTranslate = () => {
    useEffect(() => {
        const addTranslateScript = () => {
            if (!document.querySelector('#google-translate-script')) {
                const script = document.createElement('script');
                script.id = 'google-translate-script';
                script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                script.async = true;
                document.body.appendChild(script);

                script.onload = () => {
                    if (window.googleTranslateElementInit) {
                        window.googleTranslateElementInit();
                    }
                };
            } else if (window.googleTranslateElementInit) {
                window.googleTranslateElementInit();
            }
        };



        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                if (!document.querySelector('.goog-te-combo')) {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'en',
                            includedLanguages: 'en,ro,de,it', // Customize the languages here
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE, // Use INLINE or SIMPLE for a dropdown-only look
                        },
                        'google_translate_element'
                    );
                }
            }
        };


        addTranslateScript();
    }, []);

    return (
        <>


    <div id="google_translate_element" style={{position: 'relative', zIndex: '10000', marginBottom: '5px'}}/>
    <style>{`
             #google_translate_element {
             background: transparent; /* Remove background box */
             padding: 0; /* Remove additional padding */
             border-radius: 0; /* Remove border radius */
             box-shadow: none; /* Remove shadow */
             display: flex;
             padding-top:10px;
             align-items: center;
             color: #333; /* Match header text color */
             transition: color 0.3s ease-in-out;
}

            #google_translate_element:hover {
            color: #1f2937; /* Slightly darker color on hover for interaction */
}

                .goog-te-gadget-simple {
                    border: none;
                    background-color: transparent;
                    padding: 0;
                    display: inline-flex;
                    align-items: center;
                }

                .goog-te-combo {
                    padding: 6px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .goog-logo-link {
                    display: none !important;
                }

                .goog-te-gadget span {
                    display: none;
                }

                /* Specific styles for hiding toolbar and making it look like dropdown */
                .goog-te-banner-frame.skiptranslate {
                    display: none !important; /* Hide the translation bar */
                }

                html {
                    margin-top: 0 !important; /* Prevent unnecessary margin for translation bar */
                }
            `}</style>
        </>
    );
};

export default GoogleTranslate;
