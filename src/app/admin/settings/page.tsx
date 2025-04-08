"use client"

import { useState } from "react"
import { Save } from "lucide-react"

export default function SettingsPage() {
    const [generalSettings, setGeneralSettings] = useState({
        siteName: "Cat Showcase",
        siteDescription: "A showcase of beautiful cats available for adoption.",
        contactEmail: "contact@catshowcase.com",
        enableComments: true,
        enableLikes: true,
        itemsPerPage: 12,
    })

    const [seoSettings, setSeoSettings] = useState({
        metaTitle: "Cat Showcase - Beautiful Cats for Adoption",
        metaDescription:
            "Discover beautiful cats available for adoption. Browse our showcase of cats with detailed profiles and high-quality images.",
        ogImage: "https://example.com/images/og-image.jpg",
        googleAnalyticsId: "",
    })

    const [firebaseSettings, setFirebaseSettings] = useState({
        storagePrefix: "cats/",
        imageQuality: "high",
        maxFileSize: 5,
        enableImageCompression: true,
        enableVideoCompression: true,
    })

    const handleSaveGeneral = () => {
        // In a real app, this would save to Firebase
        alert("General settings saved!")
    }

    const handleSaveSeo = () => {
        // In a real app, this would save to Firebase
        alert("SEO settings saved!")
    }

    const handleSaveFirebase = () => {
        // In a real app, this would save to Firebase
        alert("Firebase settings saved!")
    }

    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-8">
                {/* General Settings */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-xl font-bold">General Settings</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2"
                                value={generalSettings.siteName}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                            <textarea
                                className="w-full border rounded-md px-3 py-2"
                                rows={3}
                                value={generalSettings.siteDescription}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-md px-3 py-2"
                                value={generalSettings.contactEmail}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Items Per Page</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={generalSettings.itemsPerPage}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, itemsPerPage: Number(e.target.value) })}
                            >
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={16}>16</option>
                                <option value={24}>24</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enableComments"
                                checked={generalSettings.enableComments}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, enableComments: e.target.checked })}
                            />
                            <label htmlFor="enableComments" className="text-sm font-medium text-gray-700">
                                Enable Comments
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enableLikes"
                                checked={generalSettings.enableLikes}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, enableLikes: e.target.checked })}
                            />
                            <label htmlFor="enableLikes" className="text-sm font-medium text-gray-700">
                                Enable Likes
                            </label>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end">
                        <button
                            onClick={handleSaveGeneral}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow flex items-center"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* SEO Settings */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-xl font-bold">SEO Settings</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2"
                                value={seoSettings.metaTitle}
                                onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                            <textarea
                                className="w-full border rounded-md px-3 py-2"
                                rows={3}
                                value={seoSettings.metaDescription}
                                onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Open Graph Image URL</label>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2"
                                value={seoSettings.ogImage}
                                onChange={(e) => setSeoSettings({ ...seoSettings, ogImage: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2"
                                placeholder="G-XXXXXXXXXX"
                                value={seoSettings.googleAnalyticsId}
                                onChange={(e) => setSeoSettings({ ...seoSettings, googleAnalyticsId: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end">
                        <button
                            onClick={handleSaveSeo}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow flex items-center"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Firebase Settings */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="border-b px-6 py-4">
                        <h2 className="text-xl font-bold">Firebase Settings</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Prefix</label>
                            <input
                                type="text"
                                className="w-full border rounded-md px-3 py-2"
                                value={firebaseSettings.storagePrefix}
                                onChange={(e) => setFirebaseSettings({ ...firebaseSettings, storagePrefix: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This prefix will be added to all uploaded files in Firebase Storage
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image Quality</label>
                            <select
                                className="w-full border rounded-md px-3 py-2"
                                value={firebaseSettings.imageQuality}
                                onChange={(e) => setFirebaseSettings({ ...firebaseSettings, imageQuality: e.target.value })}
                            >
                                <option value="low">Low (faster loading)</option>
                                <option value="medium">Medium</option>
                                <option value="high">High (better quality)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
                            <input
                                type="number"
                                className="w-full border rounded-md px-3 py-2"
                                value={firebaseSettings.maxFileSize}
                                onChange={(e) => setFirebaseSettings({ ...firebaseSettings, maxFileSize: Number(e.target.value) })}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enableImageCompression"
                                checked={firebaseSettings.enableImageCompression}
                                onChange={(e) => setFirebaseSettings({ ...firebaseSettings, enableImageCompression: e.target.checked })}
                            />
                            <label htmlFor="enableImageCompression" className="text-sm font-medium text-gray-700">
                                Enable Image Compression
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="enableVideoCompression"
                                checked={firebaseSettings.enableVideoCompression}
                                onChange={(e) => setFirebaseSettings({ ...firebaseSettings, enableVideoCompression: e.target.checked })}
                            />
                            <label htmlFor="enableVideoCompression" className="text-sm font-medium text-gray-700">
                                Enable Video Compression
                            </label>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end">
                        <button
                            onClick={handleSaveFirebase}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow flex items-center"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
