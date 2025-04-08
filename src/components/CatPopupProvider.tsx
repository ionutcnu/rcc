"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import CatPopup from "@/components/elements/CatsRelated/CatPopup"

interface CatPopupContextType {
    showPopup: (message: string) => void
}

const CatPopupContext = createContext<CatPopupContextType | undefined>(undefined)

export function CatPopupProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false)
    const [message, setMessage] = useState("")

    const showPopup = (message: string) => {
        setMessage(message)
        setVisible(true)
    }

    const handleClose = () => {
        setVisible(false)
    }

    return (
        <CatPopupContext.Provider value={{ showPopup }}>
            {children}
            <CatPopup message={message} visible={visible} onClose={handleClose} />
        </CatPopupContext.Provider>
    )
}

export function useCatPopup() {
    const context = useContext(CatPopupContext)
    if (context === undefined) {
        throw new Error("useCatPopup must be used within a CatPopupProvider")
    }
    return context
}
