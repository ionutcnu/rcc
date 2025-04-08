"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"

// Mock data for demonstration
const mockCats = [
  { id: "1", name: "Whiskers", breed: "Persian", age: 3, description: "A fluffy Persian cat with blue eyes." },
  { id: "2", name: "Shadow", breed: "Maine Coon", age: 5, description: "A large and friendly Maine Coon." },
  { id: "3", name: "Luna", breed: "Siamese", age: 2, description: "An elegant Siamese with striking blue eyes." },
]

export function CatProfiles() {
  const [cats, setCats] = useState(mockCats)
  const [editingCat, setEditingCat] = useState<(typeof mockCats)[0] | null>(null)

  const handleEditCat = (cat: (typeof mockCats)[0]) => {
    setEditingCat({ ...cat })
  }

  const handleSaveCat = () => {
    if (!editingCat) return

    if (editingCat.id) {
      // Update existing cat
      setCats(cats.map((cat) => (cat.id === editingCat.id ? editingCat : cat)))
    } else {
      // Add new cat with generated ID
      setCats([...cats, { ...editingCat, id: Date.now().toString() }])
    }

    setEditingCat(null)
  }

  const handleDeleteCat = (id: string) => {
    setCats(cats.filter((cat) => cat.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cat Profiles</h2>
        <Button onClick={() => setEditingCat({ id: "", name: "", breed: "", age: 0, description: "" })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Cat
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {cats.map((cat) => (
            <Card key={cat.id}>
              <CardHeader>
                <CardTitle>{cat.name}</CardTitle>
                <CardDescription>
                  {cat.breed}, {cat.age} years old
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
                <Button variant="destructive" size="sm" onClick={() => handleDeleteCat(cat.id)}>
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
                    {cat.breed}, {cat.age} years old
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
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteCat(cat.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
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
                  value={editingCat.name}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={editingCat.breed}
                  onChange={(e) => setEditingCat({ ...editingCat, breed: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={editingCat.age}
                  onChange={(e) => setEditingCat({ ...editingCat, age: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingCat.description}
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
    </div>
  )
}
