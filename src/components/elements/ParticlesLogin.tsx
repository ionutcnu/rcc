'use client';

import React, { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import type { ISourceOptions, Engine } from 'tsparticles-engine';
import { loadFull } from 'tsparticles';

interface ParticleBackgroundProps {
    className?: string; // Optionally pass a className for styling
    quantity?: number;  // Optionally set the particle count
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ className, quantity = 100 }) => {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadFull(engine); // Loads tsParticles full engine
    }, []);

    const particlesLoaded = useCallback(async () => {}, []);

    const particlesOptions = useMemo<ISourceOptions>(() => ({
        particles: {
            number: {
                value: quantity, // Use the quantity prop here
                density: {
                    enable: true,
                    value_area: 800,
                },
            },
            color: {
                value: '#ffffff',
            },
            shape: {
                type: 'circle',
                stroke: {
                    width: 0,
                    color: '#000000',
                },
                polygon: {
                    nb_sides: 5,
                },
                image: {
                    src: 'img/github.svg',
                    width: 100,
                    height: 100,
                },
            },
            opacity: {
                value: 0.5,
                random: true,
                anim: {
                    enable: false,
                    speed: 1,
                    opacity_min: 0.1,
                    sync: false,
                },
            },
            size: {
                value: 4,
                random: true,
                anim: {
                    enable: false,
                    speed: 40,
                    size_min: 0.1,
                    sync: false,
                },
            },
            links: {
                // 'line_linked' has been updated to 'links' in newer versions
                enable: false,
                distance: 500,
                color: '#ffffff',
                opacity: 0.4,
                width: 2,
            },
            move: {
                enable: true,
                speed: 6,
                direction: 'bottom',
                random: false,
                straight: false,
                outMode: 'out', // Updated property name
                bounce: false,
                attract: {
                    enable: false,
                    rotateX: 600,
                    rotateY: 1200,
                },
            },
        },
        interactivity: {
            detectsOn: 'canvas', // Updated property name and value
            events: {
                onHover: {
                    enable: true,
                    mode: 'repulse',
                },
                onClick: {
                    enable: true,
                    mode: 'repulse',
                },
                resize: true,
            },
            modes: {
                grab: {
                    distance: 400,
                    links: {
                        opacity: 0.5,
                    },
                },
                bubble: {
                    distance: 400,
                    size: 4,
                    duration: 0.3,
                    opacity: 1,
                    speed: 3,
                },
                repulse: {
                    distance: 100,
                    duration: 0.4,
                },
                push: {
                    quantity: 4, // Updated property name
                },
                remove: {
                    quantity: 2, // Updated property name
                },
            },
        },
        retina_detect: true,
    }), [quantity]);

    return (
        <Particles
            id="tsparticles"
            className={className}
            init={particlesInit}
            loaded={particlesLoaded}
            options={particlesOptions}
        />
    );
};

export default ParticleBackground;
