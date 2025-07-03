"use client"

import { useState, useEffect } from "react"
import {
    Search,
    Loader2,
    UserCheck,
    UserX,
    Trash2,
    RefreshCw,
    UserPlus,
    MoreHorizontal,
    Shield,
    ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast, showSuccessToast, showErrorToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SimpleConfirmDialog } from "@/components/simple-confirm-dialog"

interface User {
    uid: string
    email: string
    displayName?: string | null
    photoURL?: string | null
    isAdmin: boolean
    createdAt?: string
    lastSignInTime?: string
    disabled?: boolean
}

export function UserManagement() {
    const [searchQuery, setSearchQuery] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [updating, setUpdating] = useState<string | null>(null)
    const { toast } = useToast()

    // New user dialog state
    const [newUserDialogOpen, setNewUserDialogOpen] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState("")
    const [newUserPassword, setNewUserPassword] = useState("")
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
    const [isCreatingUser, setIsCreatingUser] = useState(false)

    // Delete user dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Load users on component mount
    useEffect(() => {
        fetchUsers()
    }, [])

    // Filter users when search query changes
    useEffect(() => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            setFilteredUsers(
                users.filter(
                    (user) =>
                        user.email?.toLowerCase().includes(query) ||
                        user.displayName?.toLowerCase().includes(query) ||
                        user.uid.toLowerCase().includes(query),
                ),
            )
        } else {
            setFilteredUsers(users)
        }
    }, [searchQuery, users])

    // Function to fetch all users
    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/users")

            if (!response.ok) {
                throw new Error("Failed to fetch users")
            }

            const data = await response.json()

            if (data.success) {
                setUsers(data.users)
                setFilteredUsers(data.users)
            } else {
                showErrorToast(data.error || "Failed to fetch users")
            }
        } catch (error) {
            console.error("Error fetching users:", error)
            showErrorToast("An error occurred while fetching users")
        } finally {
            setLoading(false)
        }
    }

    // Function to refresh the user list
    const refreshUsers = async () => {
        setRefreshing(true)
        await fetchUsers()
        setRefreshing(false)
    }

    // Function to search for users by email
    const searchUsers = async () => {
        if (!searchQuery.trim()) {
            fetchUsers()
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`)

            if (!response.ok) {
                throw new Error("Failed to search users")
            }

            const data = await response.json()

            if (data.success) {
                setUsers(data.users)
                setFilteredUsers(data.users)
            } else {
                showErrorToast(data.error || "Failed to search users")
            }
        } catch (error) {
            console.error("Error searching users:", error)
            showErrorToast("An error occurred while searching users")
        } finally {
            setLoading(false)
        }
    }

    // Function to toggle admin status
    const toggleAdminStatus = async (user: User) => {
        setUpdating(user.uid)
        try {
            const response = await fetch("/api/auth/set-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: user.uid,
                    admin: !user.isAdmin,
                }),
            })

            const data = await response.json()

            if (data.success) {
                // Update both users and filteredUsers states
                const updatedUser = { ...user, isAdmin: !user.isAdmin }
                setUsers(users.map((u) => (u.uid === user.uid ? updatedUser : u)))
                setFilteredUsers(filteredUsers.map((u) => (u.uid === user.uid ? updatedUser : u)))
                showSuccessToast(`${user.email} is ${!user.isAdmin ? "now" : "no longer"} an admin`)
            } else {
                showErrorToast(data.error || "Failed to update admin status")
            }
        } catch (error) {
            console.error("Error updating admin status:", error)
            showErrorToast("An error occurred while updating admin status")
        } finally {
            setUpdating(null)
        }
    }

    // Function to toggle user disabled status
    const toggleUserDisabled = async (user: User) => {
        setUpdating(user.uid)
        try {
            const response = await fetch("/api/users/update-status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: user.uid,
                    disabled: !user.disabled,
                }),
            })

            const data = await response.json()

            if (data.success) {
                // Update both users and filteredUsers states
                const updatedUser = { ...user, disabled: !user.disabled }
                setUsers(users.map((u) => (u.uid === user.uid ? updatedUser : u)))
                setFilteredUsers(filteredUsers.map((u) => (u.uid === user.uid ? updatedUser : u)))
                showSuccessToast(`${user.email} is ${!user.disabled ? "now disabled" : "now enabled"}`)
            } else {
                showErrorToast(data.error || "Failed to update user status")
            }
        } catch (error) {
            console.error("Error updating user status:", error)
            showErrorToast("An error occurred while updating user status")
        } finally {
            setUpdating(null)
        }
    }

    // Function to create a new user
    const createUser = async () => {
        if (!newUserEmail || !newUserPassword) {
            showErrorToast("Email and password are required")
            return
        }

        setIsCreatingUser(true)
        try {
            const response = await fetch("/api/users/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    isAdmin: newUserIsAdmin,
                }),
            })

            const data = await response.json()

            if (data.success) {
                showSuccessToast(`User ${newUserEmail} created successfully`)
                setNewUserDialogOpen(false)
                setNewUserEmail("")
                setNewUserPassword("")
                setNewUserIsAdmin(false)

                // Refresh the user list
                await fetchUsers()
            } else {
                showErrorToast(data.error || "Failed to create user")
            }
        } catch (error) {
            console.error("Error creating user:", error)
            showErrorToast("An error occurred while creating user")
        } finally {
            setIsCreatingUser(false)
        }
    }

    // Function to handle delete button click
    const handleDeleteClick = (user: User) => {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    // Function to delete a user
    const deleteUser = async () => {
        if (!userToDelete) return

        setIsDeleting(true)
        try {
            const response = await fetch("/api/users/delete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uid: userToDelete.uid,
                }),
            })

            const data = await response.json()

            if (data.success) {
                // Update both users and filteredUsers states
                const updatedUsers = users.filter((u) => u.uid !== userToDelete.uid)
                setUsers(updatedUsers)
                setFilteredUsers(filteredUsers.filter((u) => u.uid !== userToDelete.uid))
                showSuccessToast(`User ${userToDelete.email} deleted successfully`)
                setDeleteDialogOpen(false)
                setUserToDelete(null)
            } else {
                showErrorToast(data.error || "Failed to delete user")
            }
        } catch (error) {
            console.error("Error deleting user:", error)
            showErrorToast("An error occurred while deleting user")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage users and their permissions</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={refreshUsers} disabled={refreshing}>
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            <span className="ml-2">Refresh</span>
                        </Button>
                        <Button size="sm" onClick={() => setNewUserDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by email, name, or ID..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                            />
                        </div>
                        <Button onClick={searchUsers} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </div>

                    <Tabs defaultValue="all">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All Users</TabsTrigger>
                            <TabsTrigger value="admins">Admins</TabsTrigger>
                            <TabsTrigger value="disabled">Disabled</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <UserTable
                                users={filteredUsers}
                                loading={loading}
                                updating={updating}
                                onToggleAdmin={toggleAdminStatus}
                                onToggleDisabled={toggleUserDisabled}
                                onDelete={handleDeleteClick}
                            />
                        </TabsContent>

                        <TabsContent value="admins">
                            <UserTable
                                users={filteredUsers.filter((user) => user.isAdmin)}
                                loading={loading}
                                updating={updating}
                                onToggleAdmin={toggleAdminStatus}
                                onToggleDisabled={toggleUserDisabled}
                                onDelete={handleDeleteClick}
                            />
                        </TabsContent>

                        <TabsContent value="disabled">
                            <UserTable
                                users={filteredUsers.filter((user) => user.disabled)}
                                loading={loading}
                                updating={updating}
                                onToggleAdmin={toggleAdminStatus}
                                onToggleDisabled={toggleUserDisabled}
                                onDelete={handleDeleteClick}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <div className="text-sm text-gray-500">
                        Total users: {users.length} | Admins: {users.filter((u) => u.isAdmin).length} | Disabled:{" "}
                        {users.filter((u) => u.disabled).length}
                    </div>
                </CardFooter>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the system. You can optionally grant them admin privileges.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="user@example.com"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch id="admin" checked={newUserIsAdmin} onCheckedChange={setNewUserIsAdmin} />
                            <Label htmlFor="admin">Grant admin privileges</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={createUser} disabled={isCreatingUser}>
                            {isCreatingUser ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create User"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User Confirmation Dialog */}
            <SimpleConfirmDialog
                isOpen={deleteDialogOpen}
                title="Delete User"
                message={`Are you sure you want to delete ${userToDelete?.email}? This action cannot be undone.`}
                onConfirm={deleteUser}
                onCancel={() => {
                    setDeleteDialogOpen(false)
                    setUserToDelete(null)
                }}
            />
        </div>
    )
}

// User Table Component
function UserTable({
                       users,
                       loading,
                       updating,
                       onToggleAdmin,
                       onToggleDisabled,
                       onDelete,
                   }: {
    users: User[]
    loading: boolean
    updating: string | null
    onToggleAdmin: (user: User) => void
    onToggleDisabled: (user: User) => void
    onDelete: (user: User) => void
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading users...</span>
            </div>
        )
    }

    if (users.length === 0) {
        return <div className="text-center py-8 text-gray-500">No users found matching your criteria.</div>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.uid} className={user.disabled ? "bg-gray-50" : ""}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.displayName || "—"}</TableCell>
                        <TableCell>
                            {user.disabled ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    Disabled
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Active
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            {user.isAdmin ? (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-300">Admin</Badge>
                            ) : (
                                <Badge variant="outline">User</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onToggleAdmin(user)}>
                                        {updating === user.uid ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : user.isAdmin ? (
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Shield className="mr-2 h-4 w-4" />
                                        )}
                                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onToggleDisabled(user)}>
                                        {updating === user.uid ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : user.disabled ? (
                                            <UserCheck className="mr-2 h-4 w-4" />
                                        ) : (
                                            <UserX className="mr-2 h-4 w-4" />
                                        )}
                                        {user.disabled ? "Enable User" : "Disable User"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(user)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
