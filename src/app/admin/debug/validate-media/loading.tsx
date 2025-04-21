import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ValidateMediaLoading() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center mb-6">
                <Skeleton className="h-10 w-32 mr-4" />
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-full max-w-md" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-48" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <Skeleton className="h-4 w-24 mb-2" />
                                                <Skeleton className="h-8 w-16" />
                                            </div>
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
