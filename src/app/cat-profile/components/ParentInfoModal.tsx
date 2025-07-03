"use client"
import Image from "next/image"
import type React from "react"
import { createPortal } from "react-dom"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaTree } from "react-icons/fa"
import { ChevronDown, ChevronUp } from "lucide-react"
import { fetchCatById } from "@/lib/client/catClient"
import type { CatProfile } from "@/lib/types/cat"

// === TYPES ===
interface Cat {
    id: string | number
    name: string
    mainImage: string
    motherId?: string | number | null
    fatherId?: string | number | null
    children?: Cat[]
    parents?: Cat[] // Add this to support the parent tree structure
}

interface ParentInfoPopupProps {
    currentCatId: string | number | null
    catData?: CatProfile // Optional prop to pass cat data directly
}

// === COMPONENT: Cat Node ===
const CatNode = ({ cat }: { cat: Cat }) => {
    return (
      <div
        onClick={() => (window.location.href = `/cat-profile/${encodeURIComponent(cat.name)}`)}
        className="flex flex-col items-center cursor-pointer group min-w-[7rem] max-w-[8rem]"
      >
          <Image
            src={cat.mainImage || "/tabby-sunbeam.png"}
            alt={cat.name}
            width={112}
            height={112}
            className="rounded-full shadow-md"
            style={{ objectFit: "cover" }}
          />
          <span className="mt-3 text-center text-black text-xl font-bold tracking-tight group-hover:underline break-words leading-tight">
        {cat.name}
      </span>
      </div>
    )
}

// === COMPONENT: Recursive Tree ===
const FamilyTree = ({ data, isRoot = true }: { data: Cat; isRoot?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(isRoot)
    const toggleExpand = () => setIsExpanded(!isExpanded)
    const childrenRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (isExpanded && childrenRef.current) {
            const timeout = setTimeout(() => {
                childrenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }, 300) // match the animation duration

            return () => clearTimeout(timeout)
        }
    }, [isExpanded])

    // Display parents if they exist
    const hasParents = data.parents && data.parents.length > 0

    return (
      <div className={`flex flex-col items-center ${isRoot ? "" : "mt-8"}`}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
              <CatNode cat={data} />

              {(hasParents || (data.children && data.children.length > 0)) && (
                <button
                  onClick={toggleExpand}
                  className="mt-2 h-8 w-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-black hover:border-black transition"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
          </motion.div>

          <AnimatePresence>
              {isExpanded && hasParents && (
                <motion.div
                  ref={childrenRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center mt-6 pt-6 border-t border-gray-300"
                >
                    <div className="flex gap-12">
                        {data.parents?.map((parent, index) => {
                            const relation = parent.id === data.motherId ? "Mother" : parent.id === data.fatherId ? "Father" : ""
                            return (
                              <div key={index} className="flex flex-col items-center px-3">
                                  <div
                                    className={`mb-2 text-sm font-bold tracking-wide uppercase ${
                                      relation === "Mother"
                                        ? "text-pink-500"
                                        : relation === "Father"
                                          ? "text-blue-500"
                                          : "text-gray-500"
                                    }`}
                                  >
                                      {relation}
                                  </div>
                                  <div className="h-6 w-px bg-gray-300 mb-2" />
                                  <CatNode cat={parent} />

                                  {/* Recursively show parent's parents if they exist */}
                                  {parent.parents && parent.parents.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-300">
                                        <div className="flex gap-8">
                                            {parent.parents.map((grandparent, idx) => {
                                                const grandparentRelation =
                                                  grandparent.id === parent.motherId
                                                    ? "Mother"
                                                    : grandparent.id === parent.fatherId
                                                      ? "Father"
                                                      : ""
                                                return (
                                                  <div key={idx} className="flex flex-col items-center px-3">
                                                      <div
                                                        className={`mb-2 text-sm font-bold tracking-wide uppercase ${
                                                          grandparentRelation === "Mother"
                                                            ? "text-pink-500"
                                                            : grandparentRelation === "Father"
                                                              ? "text-blue-500"
                                                              : "text-gray-500"
                                                        }`}
                                                      >
                                                          {grandparentRelation}
                                                      </div>
                                                      <div className="h-6 w-px bg-gray-300 mb-2" />
                                                      <CatNode cat={grandparent} />
                                                  </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                  )}
                              </div>
                            )
                        })}
                    </div>
                </motion.div>
              )}

              {isExpanded && data.children && data.children.length > 0 && (
                <motion.div
                  ref={childrenRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-12 mt-6 pt-6 border-t border-gray-300"
                >
                    {data.children.map((child, index) => {
                        const relation = child.motherId === data.id ? "Mother" : child.fatherId === data.id ? "Father" : ""
                        return (
                          <div key={index} className="flex flex-col items-center px-3">
                              <div
                                className={`mb-2 text-sm font-bold tracking-wide uppercase ${
                                  relation === "Mother"
                                    ? "text-pink-500"
                                    : relation === "Father"
                                      ? "text-blue-500"
                                      : "text-gray-500"
                                }`}
                              >
                                  {relation}
                              </div>
                              <div className="h-6 w-px bg-gray-300 mb-2" />
                              <FamilyTree data={child} isRoot={false} />
                          </div>
                        )
                    })}
                </motion.div>
              )}
          </AnimatePresence>
      </div>
    )
}

// === COMPONENT: Popup Wrapper ===
const ParentInfoPopup: React.FC<ParentInfoPopupProps> = ({ currentCatId, catData }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [familyData, setFamilyData] = useState<Cat | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Function to build family tree from Firebase data
    const buildFamilyTreeFromFirebase = async (rootCat: CatProfile) => {
        try {
            setLoading(true)

            // Create the root cat object
            const rootCatFormatted: Cat = {
                id: rootCat.id || "0",
                name: rootCat.name,
                mainImage: rootCat.mainImage || "/tabby-sunbeam.png",
                motherId: rootCat.motherId || null,
                fatherId: rootCat.fatherId || null,
                children: [],
            }

            // Fetch parents data
            let mother = null
            let father = null

            // Fetch mother if exists
            if (rootCat.motherId) {
                try {
                    const motherData = await fetchCatById(rootCat.motherId.toString())
                    if (motherData) {
                        mother = {
                            id: motherData.id || "0",
                            name: motherData.name,
                            mainImage: motherData.mainImage || "/tabby-sunbeam.png",
                            motherId: motherData.motherId,
                            fatherId: motherData.fatherId,
                            children: [rootCatFormatted],
                        }

                        // Add mother's parents if they exist
                        if (motherData.motherId || motherData.fatherId) {
                            mother.children = [] // Clear children temporarily for recursive fetch
                            const motherWithParents = await buildParentTree(motherData)
                            mother = {
                                ...motherWithParents,
                                children: [rootCatFormatted],
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error fetching mother:", err)
                }
            }

            // Fetch father if exists
            if (rootCat.fatherId) {
                try {
                    const fatherData = await fetchCatById(rootCat.fatherId.toString())
                    if (fatherData) {
                        father = {
                            id: fatherData.id || "0",
                            name: fatherData.name,
                            mainImage: fatherData.mainImage || "/tabby-sunbeam.png",
                            motherId: fatherData.motherId,
                            fatherId: fatherData.fatherId,
                            children: [rootCatFormatted],
                        }

                        // Add father's parents if they exist
                        if (fatherData.motherId || fatherData.fatherId) {
                            father.children = [] // Clear children temporarily for recursive fetch
                            const fatherWithParents = await buildParentTree(fatherData)
                            father = {
                                ...fatherWithParents,
                                children: [rootCatFormatted],
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error fetching father:", err)
                }
            }

            // If we have both parents, create a family structure
            if (mother && father) {
                // Return the root cat with its parents
                rootCatFormatted.parents = [mother, father]
            } else if (mother) {
                rootCatFormatted.parents = [mother]
            } else if (father) {
                rootCatFormatted.parents = [father]
            }

            return rootCatFormatted
        } catch (err) {
            console.error("Error building family tree:", err)
            setError("Failed to load family tree")
            return null
        } finally {
            setLoading(false)
        }
    }

    // Helper function to recursively build parent tree
    const buildParentTree = async (cat: CatProfile): Promise<Cat> => {
        const catNode: Cat = {
            id: cat.id || "0",
            name: cat.name,
            mainImage: cat.mainImage || "/tabby-sunbeam.png",
            motherId: cat.motherId || null,
            fatherId: cat.fatherId || null,
            children: [],
            parents: [],
        }

        // Fetch mother if exists
        if (cat.motherId) {
            try {
                const motherData = await fetchCatById(cat.motherId.toString())
                if (motherData) {
                    const mother: Cat = {
                        id: motherData.id || "0",
                        name: motherData.name,
                        mainImage: motherData.mainImage || "/tabby-sunbeam.png",
                        motherId: motherData.motherId,
                        fatherId: motherData.fatherId,
                        children: [],
                    }
                    if (!catNode.parents) catNode.parents = []
                    catNode.parents.push(mother)
                }
            } catch (err) {
                console.error("Error fetching mother:", err)
            }
        }

        // Fetch father if exists
        if (cat.fatherId) {
            try {
                const fatherData = await fetchCatById(cat.fatherId.toString())
                if (fatherData) {
                    const father: Cat = {
                        id: fatherData.id || "0",
                        name: fatherData.name,
                        mainImage: fatherData.mainImage || "/tabby-sunbeam.png",
                        motherId: fatherData.motherId,
                        fatherId: fatherData.fatherId,
                        children: [],
                    }
                    if (!catNode.parents) catNode.parents = []
                    catNode.parents.push(father)
                }
            } catch (err) {
                console.error("Error fetching father:", err)
            }
        }

        return catNode
    }

    // Fetch family data when the modal is opened
    const fetchFamilyData = async () => {
        if (!catData && !currentCatId) {
            setError("No cat data available")
            return
        }

        try {
            setLoading(true)
            setError(null)

            // If we already have cat data, use it directly
            if (catData) {
                const familyTree = await buildFamilyTreeFromFirebase(catData)
                setFamilyData(familyTree)
                return
            }

            // Otherwise fetch the cat by ID
            if (currentCatId) {
                const catData = await fetchCatById(currentCatId.toString())
                if (catData) {
                    const familyTree = await buildFamilyTreeFromFirebase(catData as CatProfile)
                    setFamilyData(familyTree)
                } else {
                    setError("Cat not found")
                }
            }
        } catch (err) {
            console.error("Error fetching family data:", err)
            setError("Failed to load family data")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = () => {
        setIsOpen(true)
        fetchFamilyData()
    }

    return (
      <>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-3 px-5 py-3 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-xl font-semibold text-base shadow-sm transition"
          >
              <FaTree className="w-5 h-5" />
              <span>View Family Tree</span>
          </button>

          {isOpen && typeof window !== 'undefined' && createPortal(
            <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
                  style={{ zIndex: 9999 }}
                >
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.95 }}
                      className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto"
                    >
                        {/* Sticky Close Button */}
                        <button
                          onClick={() => setIsOpen(false)}
                          className="sticky top-4 left-full -translate-x-full z-30 w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:text-black hover:border-black transition-shadow shadow-sm hover:shadow-md"
                          aria-label="Close modal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05a1 1 0 011.414-1.414L10 8.586z"
                                  clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        {/* Modal Scrollable Content */}
                        <div className="p-8">
                            <h2 className="text-2xl font-semibold text-center w-full text-gray-800 mb-6">
                                {catData?.name || "Cat"}'s Genealogy
                            </h2>

                            <div className="overflow-x-auto w-full">
                                <div className="min-w-fit flex justify-center">
                                    {loading ? (
                                      <div className="flex items-center justify-center p-8">
                                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                      </div>
                                    ) : error ? (
                                      <p className="text-center text-red-500 p-8">{error}</p>
                                    ) : familyData ? (
                                      <FamilyTree data={familyData} />
                                    ) : (
                                      <p className="text-center text-gray-500 p-8">No family tree available.</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-10 flex justify-center">
                                <button
                                  onClick={() => setIsOpen(false)}
                                  className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm font-medium"
                                >
                                    Close Diagram
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>,
            document.body
          )}
      </>
    )
}

export default ParentInfoPopup
