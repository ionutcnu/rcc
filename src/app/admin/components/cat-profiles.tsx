"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Pencil, Trash2, Loader2 } from "lucide-react"
import { SimpleConfirmDialog } from "@/components/simple-confirm-dialog"
import { fetchAllCats } from "@/lib/client/catClient"
import { useCatPopup } from "@/components/CatPopupProvider"
import type { CatProfile } from "@/lib/types/cat"

export function CatProfiles() {
    const [cats, setCats] = useState<CatProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [editingCat, setEditingCat] = useState<Partial<CatProfile> | null>(null)
    const { showPopup } = useCatPopup()

    // State for delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [catToDelete, setCatToDelete] = useState<CatProfile | null>(null)

    // Fetch cats from API on component mount
    useEffect(() => {
        async function fetchCats() {
            try {
                setLoading(true)
                const fetchedCats = await fetchAllCats()
                setCats(fetchedCats)
            } catch (error) {
                console.error("Error fetching cats:", error)
                showPopup("Failed to load cats")
            } finally {
                setLoading(false)
            }
        }

        fetchCats()
    }, [showPopup])

    const handleEditCat = (cat: CatProfile) => {
        setEditingCat({ ...cat })
    }

    const handleSaveCat = async () => {
        if (!editingCat) return

        try {
            if (editingCat.id) {
                // Update existing cat using API
                const response = await fetch("/api/cats/update", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(editingCat),
                })

                if (!response.ok) {
                    throw new Error("Failed to update cat")
                }

                // Update local state
                setCats(cats.map((cat) => (cat.id === editingCat.id ? { ...cat, ...editingCat } : cat)))
                showPopup(`${editingCat.name} updated successfully`)
            } else {
                // Add new cat using API
                const response = await fetch("/api/cats/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(editingCat),
                })

                if (!response.ok) {
                    throw new Error("Failed to add cat")
                }

                const newCat = await response.json()
                setCats([...cats, newCat])
                showPopup(`${editingCat.name} added successfully`)
            }
        } catch (error) {
            console.error("Error saving cat:", error)
            showPopup("Error saving cat")
        } finally {
            setEditingCat(null)
        }
    }

    // Function to handle delete button click - just opens the confirmation dialog
    const handleDeleteClick = (cat: CatProfile) => {
        console.log("Delete clicked for cat:", cat.name)
        setCatToDelete(cat)
        setDeleteDialogOpen(true)
    }

    // Function to handle actual deletion after confirmation
    const handleConfirmDelete = async () => {
        if (!catToDelete) return

        try {
            // Delete cat using API
            const response = await fetch(`/api/cats/delete?id=${catToDelete.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to delete cat")
            }

            setCats(cats.filter((cat) => cat.id !== catToDelete.id))
            showPopup(`${catToDelete.name} deleted successfully`)
        } catch (error) {
            console.error("Error deleting cat:", error)
            showPopup("Error deleting cat")
        } finally {
            setDeleteDialogOpen(false)
            setCatToDelete(null)
        }
    }

    // Function to close the dialog without deleting
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false)
        setCatToDelete(null)
    }

    // Calculate current year for age display
    const currentYear = new Date().getFullYear()

    if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2">Loading cats...</span>
          </div>
        )
    }

    return (
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Cat Profiles</h2>
              <Button onClick={() => setEditingCat({ name: "", breed: "", description: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Cat
              </Button>
          </div>

          <Tabs defaultValue="grid">
              <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
              </TabsList>

              {cats.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No cats found</p>
                </div>
              ) : (
                <>
                    <TabsContent value="list" className="space-y-4">
                        {cats.map((cat) => (
                          <Card key={cat.id}>
                              <CardHeader>
                                  <CardTitle>{cat.name}</CardTitle>
                                  <CardDescription>
                                      {cat.breed}, {cat.yearOfBirth ? currentYear - cat.yearOfBirth : "Unknown"} years old
                                  </CardDescription>
                              </CardHeader>
                              <CardContent>
                                  <p>{cat.description}</p>
                              </CardContent>
                              <CardFooter className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditCat(cat)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(cat)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                  </Button>
                              </CardFooter>
                          </Card>
                        ))}
                    </TabsContent>
                    <TabsContent value="grid">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cats.map((cat) => (
                              <Card key={cat.id}>
                                  <CardHeader>
                                      <CardTitle>{cat.name}</CardTitle>
                                      <CardDescription>
                                          {cat.breed}, {cat.yearOfBirth ? currentYear - cat.yearOfBirth : "Unknown"} years old
                                      </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                      <p>{cat.description}</p>
                                  </CardContent>
                                  <CardFooter className="flex justify-end gap-2">
                                      <Button variant="outline" size="sm" onClick={() => handleEditCat(cat)}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(cat)}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                      </Button>
                                  </CardFooter>
                              </Card>
                            ))}
                        </div>
                    </TabsContent>
                </>
              )}
          </Tabs>

          {editingCat && (
            <Card>
                <CardHeader>
                    <CardTitle>{editingCat.id ? "Edit Cat Profile" : "Add New Cat"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              value={editingCat.name || ""}
                              onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="breed">Breed</Label>
                            <Input
                              id="breed"
                              value={editingCat.breed || ""}
                              onChange={(e) => setEditingCat({ ...editingCat, breed: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="yearOfBirth">Year of Birth</Label>
                            <Input
                              id="yearOfBirth"
                              type="number"
                              value={editingCat.yearOfBirth || new Date().getFullYear()}
                              onChange={(e) => setEditingCat({ ...editingCat, yearOfBirth: Number(e.target.value) })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={editingCat.description || ""}
                              onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingCat(null)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveCat}>Save</Button>
                </CardFooter>
            </Card>
          )}

          {/* Simple Delete Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={deleteDialogOpen}
            title="Delete Cat"
            message={`Are you sure you want to delete ${catToDelete?.name || "this cat"}? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
      </div>
    )
}
