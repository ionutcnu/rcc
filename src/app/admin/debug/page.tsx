"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Database, ImageIcon, Shield, Server, RefreshCw } from "lucide-react"

export default function DebugPage() {
    return (
      <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-8">Debug Tools</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Auth Debug */}
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center">
                          <Shield className="mr-2 h-5 w-5" />
                          Authentication
                      </CardTitle>
                      <CardDescription>Debug authentication related issues</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-gray-500">
                          Tools for debugging user authentication, sessions, and admin status.
                      </p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                      <Link href="/admin/debug/auth" className="w-full">
                          <Button variant="outline" className="w-full">
                              Auth Debug
                          </Button>
                      </Link>
                      <Link href="/admin/debug/set-admin" className="w-full">
                          <Button variant="outline" className="w-full">
                              Set Admin
                          </Button>
                      </Link>
                      <Link href="/admin/debug/force-logout" className="w-full">
                          <Button variant="outline" className="w-full">
                              Force Logout
                          </Button>
                      </Link>
                  </CardFooter>
              </Card>

              {/* API Testing */}
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center">
                          <Server className="mr-2 h-5 w-5" />
                          API Testing
                      </CardTitle>
                      <CardDescription>Test API endpoints and functionality</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-gray-500">
                          Tools for testing API endpoints, request/response handling, and error cases.
                      </p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                      <Link href="/admin/debug/test-api" className="w-full">
                          <Button variant="outline" className="w-full">
                              Test API
                          </Button>
                      </Link>
                      <Link href="/admin/debug/test-proxy" className="w-full">
                          <Button variant="outline" className="w-full">
                              Test Proxy
                          </Button>
                      </Link>
                  </CardFooter>
              </Card>

              {/* Media Testing */}
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center">
                          <ImageIcon className="mr-2 h-5 w-5" />
                          Media Testing
                      </CardTitle>
                      <CardDescription>Test media handling and validation</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-gray-500">
                          Tools for testing image uploads, media validation, and storage functionality.
                      </p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                      <Link href="/admin/debug/test-image" className="w-full">
                          <Button variant="outline" className="w-full">
                              Test Image
                          </Button>
                      </Link>
                      <Link href="/admin/debug/test-media" className="w-full">
                          <Button variant="outline" className="w-full">
                              Test Media
                          </Button>
                      </Link>
                      <Link href="/admin/debug/validate-media" className="w-full">
                          <Button variant="outline" className="w-full">
                              Validate Media
                          </Button>
                      </Link>
                  </CardFooter>
              </Card>

              {/* Data Migration */}
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center">
                          <Database className="mr-2 h-5 w-5" />
                          Data Migration
                      </CardTitle>
                      <CardDescription>Migrate data between storage systems</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-gray-500">
                          Tools for migrating data between Firebase and Redis for improved performance.
                      </p>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                      <Link href="/admin/debug/migrate-translations" className="w-full">
                          <Button variant="outline" className="w-full flex items-center">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Migrate Translation Usage
                          </Button>
                      </Link>
                  </CardFooter>
              </Card>
          </div>
      </div>
    )
}
