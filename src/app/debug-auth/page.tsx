"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase/firebaseConfig"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function DebugAuthPage() {
    const [clientAuth, setClientAuth] = useState<any>(null)
    const [serverSession, setServerSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    // Check client-side auth state
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const idTokenResult = await user.getIdTokenResult(true)
                    setClientAuth({
                        uid: user.uid,
                        email: user.email,
                        isAdmin: idTokenResult.claims.admin === true,
                        token: {
                            expirationTime: idTokenResult.expirationTime,
                            issuedAtTime: idTokenResult.issuedAtTime,
                            signInProvider: idTokenResult.signInProvider,
                            claims: {
                                admin: idTokenResult.claims.admin === true,
                            },
                        },
                    })
                } catch (error) {
                    setClientAuth({ error: "Error getting token details" })
                }
            } else {
                setClientAuth(null)
            }

            // Check server-side session
            await checkServerSession()
        })

        return () => unsubscribe()
    }, [])

    // Check server-side session
    const checkServerSession = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/auth/debug-session", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache",
                },
            })
            const data = await response.json()
            setServerSession(data)
        } catch (error) {
            setServerSession({ error: "Failed to fetch session data" })
        } finally {
            setLoading(false)
        }
    }

    // Refresh token and session
    const refreshTokenAndSession = async () => {
        try {
            setRefreshing(true)
            const user = auth.currentUser

            if (!user) {
                alert("No user is signed in")
                return
            }

            // Force refresh the token
            const idToken = await user.getIdToken(true)

            // Send the token to create a new session
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            })

            const data = await response.json()

            if (data.success) {
                alert("Token and session refreshed successfully!")
            } else {
                alert("Failed to refresh session: " + (data.error || "Unknown error"))
            }

            // Check server session again
            await checkServerSession()
        } catch (error: any) {
            alert("Error refreshing: " + error.message)
        } finally {
            setRefreshing(false)
        }
    }

    // Force logout
    const forceLogout = async () => {
        try {
            setLoggingOut(true)

            // Sign out from Firebase
            await auth.signOut()

            // Clear session cookie
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            })

            // Clear any client-side storage
            localStorage.clear()
            sessionStorage.clear()

            // Force reload the page
            window.location.href = "/login"
        } catch (error: any) {
            alert("Error logging out: " + error.message)
            setLoggingOut(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2">Loading authentication data...</span>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>

            <Tabs defaultValue="summary">
                <TabsList>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="client">Client Auth</TabsTrigger>
                    <TabsTrigger value="server">Server Session</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Authentication Status</CardTitle>
                            <CardDescription>Overview of your authentication state</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium">Client-side authenticated:</span>
                                    <span className={clientAuth ? "text-green-600" : "text-red-600"}>{clientAuth ? "Yes" : "No"}</span>
                                </div>

                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium">Server-side session valid:</span>
                                    <span className={serverSession?.session?.valid ? "text-green-600" : "text-red-600"}>
                    {serverSession?.session?.valid ? "Yes" : "No"}
                  </span>
                                </div>

                                <div className="flex items-center justify-between border-b pb-2">
                                    <span className="font-medium">Admin privileges:</span>
                                    <span className={clientAuth?.isAdmin ? "text-green-600" : "text-red-600"}>
                    {clientAuth?.isAdmin ? "Yes" : "No"}
                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Environment:</span>
                                    <span className="font-mono">{serverSession?.environment || "Unknown"}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 sm:flex-row">
                            <Button onClick={refreshTokenAndSession} disabled={refreshing || !clientAuth}>
                                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Refresh Token & Session
                            </Button>
                            <Button variant="destructive" onClick={forceLogout} disabled={loggingOut}>
                                {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Force Logout
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="client" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Client-side Authentication</CardTitle>
                            <CardDescription>Firebase Authentication state in the browser</CardDescription>
                        </CardHeader>
                        <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(clientAuth, null, 2)}
              </pre>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="server" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Server-side Session</CardTitle>
                            <CardDescription>Session information from the server</CardDescription>
                        </CardHeader>
                        <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(serverSession, null, 2)}
              </pre>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="mt-8 text-sm text-gray-500">
                <p>
                    If you're experiencing authentication issues, use the "Refresh Token & Session" button to refresh your
                    authentication state. If problems persist, try "Force Logout" and sign in again.
                </p>
            </div>
        </div>
    )
}
