import type { Metadata } from "next"
import NotFoundClient from "./not-found-client"

export const metadata: Metadata = {
    title: "404 - Page Not Found | Red Cat Cuasar",
    description: "Oops! This page seems to have wandered off like a curious cat. Browse our available British Shorthair cats and kittens or return to our homepage.",
    robots: {
        index: false,
        follow: true,
    },
}

export default function NotFound() {
    return <NotFoundClient />
}