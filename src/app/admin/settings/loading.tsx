import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="h-10 w-48 bg-gray-200 animate-pulse rounded"></div>

            <div className="h-10 w-64 mb-6 bg-gray-200 animate-pulse rounded"></div>

            <Card>
                <CardHeader>
                    <div className="h-6 w-40 mb-1 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-60 bg-gray-200 animate-pulse rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="grid gap-2">
                            <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-10 w-full bg-gray-200 animate-pulse rounded"></div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                </CardFooter>
            </Card>
        </div>
    )
}