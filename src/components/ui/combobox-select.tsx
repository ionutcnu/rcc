"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export type ComboboxOption = {
    value: string
    label: string
}

interface ComboboxSelectProps {
    options: ComboboxOption[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
}

export function ComboboxSelect({
                                   options,
                                   value,
                                   onValueChange,
                                   placeholder = "Select an option",
                                   searchPlaceholder = "Search...",
                                   emptyMessage = "No results found.",
                                   className,
                                   disabled = false,
                               }: ComboboxSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery) return options

        return options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [options, searchQuery])

    const selectedOption = React.useMemo(() => {
        return options.find((option) => option.value === value)
    }, [options, value])

    // Debug logging
    React.useEffect(() => {
        console.log("ComboboxSelect options:", options)
        console.log("ComboboxSelect value:", value)
        console.log("ComboboxSelect selectedOption:", selectedOption)
    }, [options, value, selectedOption])

    const handleSelect = (optionValue: string) => {
        console.log("Option selected:", optionValue)
        // If the same value is selected, toggle it off (set to empty string)
        const newValue = optionValue === value ? "" : optionValue
        console.log("Setting new value:", newValue)
        onValueChange(newValue)
        setOpen(false)
        setSearchQuery("")
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                    onClick={() => setOpen(!open)}
                >
                    {value && selectedOption ? selectedOption.label : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-full min-w-[200px]">
                <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <ScrollArea className="max-h-[200px] overflow-auto">
                    <div className="p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm">{emptyMessage}</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                        value === option.value && "bg-accent text-accent-foreground",
                                    )}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                                    {option.label}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
