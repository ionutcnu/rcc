"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { safeErrorLog } from "@/lib/utils/logger"

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log the error in a production-safe way
        safeErrorLog("Client component error", {
            error: error.message,
            componentStack: process.env.NODE_ENV !== "production" ? errorInfo.componentStack : "Hidden in production",
        })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                this.props.fallback || (
                    <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
                        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-4">The application encountered an unexpected error.</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
