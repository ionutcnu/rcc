"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function SetAdminPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleSetAdmin = async () => {
        if (!email) return

        setLoading(true)
        setMessage(null)

        try {
            const response = await fetch("/api/auth/set-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    admin: true,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setMessage({ type: "success", text: `Successfully set ${email} as admin` })
                setEmail("")
            } else {
                setMessage({ type: "error", text: data.error || "Failed to set admin privileges" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred" })
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-10">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Set Admin Privileges</CardTitle>
                    <CardDescription>Add admin privileges to a user account</CardDescription>
                </CardHeader>
                <CardContent>
                    {message && (
                        <Alert className={`mb-4 ${message.type === "success" ? "bg-green-50" : "bg-red-50"}`}>
                            {message.type === "success" ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription className={message.type === "success" ? "text-green-700" : "text-red-700"}>
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex space-x-2">
                        <Input placeholder="User email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <Button onClick={handleSetAdmin} disabled={loading || !email}>
                            {loading ? "Setting..." : "Make Admin"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
