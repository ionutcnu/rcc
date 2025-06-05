import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="h-10 w-64 mb-6 bg-gray-200 animate-pulse rounded"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 mb-2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="h-10 w-full bg-gray-200 animate-pulse rounded mt-4"></div>
            <div className="h-8 w-full bg-gray-200 animate-pulse rounded mt-4"></div>
            <div className="h-[250px] w-full bg-gray-200 animate-pulse rounded mt-4"></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-6 w-32 mb-2 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}