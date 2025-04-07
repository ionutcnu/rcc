// /app/admin/cats/page.tsx
import Link from "next/link";
import { getAllCats } from "@/lib/firebase/catService";

export default async function AdminCatsPage() {
    const cats = await getAllCats();

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">🐱 Manage Cats</h1>
                <Link
                    href="/admin/cats/add"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded shadow"
                >
                    ➕ Add New Cat
                </Link>
            </div>

            

            <div className="space-y-4">
                {cats.map(cat => (
                    <div key={cat.id} className="border rounded-md shadow p-4 bg-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{cat.name}</h2>
                                <p className="text-gray-600 text-sm">{cat.description}</p>
                            </div>
                            <div className="space-x-2">
                                <Link
                                    href={`/admin/cats/edit/${cat.id}`}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                                >
                                    ✏️ Edit
                                </Link>

                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded"
                                    // Add delete logic here
                                >
                                    🗑️ Delete
                                </button>

                                {!cat.isDeleted && (
                                    <button
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                                        // Add archive logic here
                                    >
                                        📦 Archive
                                    </button>
                                )}

                                {cat.isDeleted && (
                                    <span className="text-red-600 font-bold">Archived</span>
                                )}
                            </div>
                        </div>

                        {/* Additional Cat Details */}
                        <div className="mt-3 text-sm text-gray-700 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div><strong>Breed:</strong> {cat.breed}</div>
                            <div><strong>Gender:</strong> {cat.gender}</div>
                            <div><strong>Color:</strong> {cat.color}</div>
                            <div><strong>Year:</strong> {cat.yearOfBirth}</div>
                            <div><strong>Vaccinated:</strong> {cat.isVaccinated ? '✅' : '❌'}</div>
                            <div><strong>Microchipped:</strong> {cat.isMicrochipped ? '✅' : '❌'}</div>
                            <div><strong>Castrated:</strong> {cat.isCastrated ? '✅' : '❌'}</div>
                            <div><strong>Status:</strong> {cat.availability}</div>
                        </div>
                    </div>
                ))}

                {cats.length === 0 && (
                    <div className="text-center text-gray-500">
                        No cats found. Click &#34;Add New Cat&#34; to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
