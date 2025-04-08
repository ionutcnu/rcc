import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />

            <Skeleton className="h-10 w-64 mb-6" />

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40 mb-1" />
                    <Skeleton className="h-4 w-60" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
        </div>
    )
}
