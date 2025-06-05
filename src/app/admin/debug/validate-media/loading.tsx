import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ValidateMediaLoading() {
    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center mb-6">
                <div className="h-10 w-32 mr-4 bg-gray-200 animate-pulse rounded"></div>
                <div>
                    <div className="h-8 w-64 mb-2 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="h-6 w-64 mb-2 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-full max-w-md bg-gray-200 animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-10 w-48 bg-gray-200 animate-pulse rounded"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="h-4 w-24 mb-2 bg-gray-200 animate-pulse rounded"></div>
                                                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
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