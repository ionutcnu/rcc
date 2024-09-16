'use client'

import React, { useRef, useState, useEffect } from 'react'
import MousePosition from '@/Utils/mouse-position'

type SpotlightProps = {
    children: React.ReactNode
    className?: string
}

export default function Spotlight({
                                      children,
                                      className = '',
                                  }: SpotlightProps) {

    const containerRef = useRef<HTMLDivElement>(null)
    const mousePosition = MousePosition()
    const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const containerSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
    const [boxes, setBoxes] = useState<Array<HTMLElement>>([])

    useEffect(() => {
        containerRef.current && setBoxes(Array.from(containerRef.current.children).map((el) => el as HTMLElement))
    }, [])

    useEffect(() => {
        initContainer()
        window.addEventListener('resize', initContainer)

        return () => {
            window.removeEventListener('resize', initContainer)
        }
    }, [boxes])

    useEffect(() => {
        onMouseMove()
    }, [mousePosition])

    const initContainer = () => {
        if(containerRef.current) {
            containerSize.current.w = containerRef.current.offsetWidth
            containerSize.current.h = containerRef.current.offsetHeight
        }
    }

    const onMouseMove = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const { w, h } = containerSize.current
            const x = mousePosition.x - rect.left
            const y = mousePosition.y - rect.top
            const inside = x < w && x > 0 && y < h && y > 0
            if (inside) {
                mouse.current.x = x
                mouse.current.y = y
                boxes.forEach((box) => {
                    const boxX = -(box.getBoundingClientRect().left - rect.left) + mouse.current.x
                    const boxY = -(box.getBoundingClientRect().top - rect.top) + mouse.current.y
                    box.style.setProperty('--mouse-x', `${boxX}px`)
                    box.style.setProperty('--mouse-y', `${boxY}px`)
                })
            }
        }
    }

    return (
        <div className={className} ref={containerRef}>{children}</div>
)
}

type SpotlightCardProps = {
    children: React.ReactNode,
    className?: string
}

export function SpotlightCard({
                                  children,
                                  className = ''
                              }: SpotlightCardProps) {
    return (
        <div className={`relative h-full bg-slate-800 rounded-3xl p-px overflow-hidden 
      before:absolute before:w-40 before:h-40 before:-left-20 before:-top-20 before:bg-blue-500 
      before:rounded-full before:opacity-0 before:pointer-events-none before:transition-opacity 
      before:duration-500 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] 
      before:group-hover:opacity-100 before:z-10 before:blur-[60px] 
      after:absolute after:w-48 after:h-48 after:-left-24 after:-top-24 after:bg-blue-500 
      after:rounded-full after:opacity-0 after:pointer-events-none after:transition-opacity 
      after:duration-500 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] 
      after:hover:opacity-20 after:z-30 after:blur-[60px] 
      group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-500/50 
      transition-transform duration-300 ease-in-out ${className}`}>
            {children}
        </div>
    );
}
