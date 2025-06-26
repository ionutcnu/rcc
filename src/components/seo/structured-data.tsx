"use client"

import Script from "next/script"

interface StructuredDataProps {
  type?: 'website' | 'organization' | 'petstore' | 'animal'
  data?: any
}

export default function StructuredData({ type = 'website', data }: StructuredDataProps) {
  const getWebsiteSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Website",
    "name": "Red Cat Cuasar",
    "url": "https://redcatcuasar.vercel.app",
    "description": "Premium British Shorthair cats and kittens from Red Cat Cuasar. GCCF-registered, health-tested breeding program with champion bloodlines.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://redcatcuasar.vercel.app/cats?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  })

  const getOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Red Cat Cuasar",
    "url": "https://redcatcuasar.vercel.app",
    "logo": "https://redcatcuasar.vercel.app/placeholder-vc3r6.png",
    "description": "Professional British Shorthair cattery specializing in premium breeding with champion bloodlines",
    "foundingDate": "2020",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://redcatcuasar.vercel.app/contact"
    },
    "sameAs": [
      "https://www.facebook.com/redcatcuasar",
      "https://www.instagram.com/redcatcuasar"
    ]
  })

  const getPetStoreSchema = () => ({
    "@context": "https://schema.org",
    "@type": "PetStore",
    "name": "Red Cat Cuasar",
    "url": "https://redcatcuasar.vercel.app",
    "description": "Premium British Shorthair cattery with GCCF-registered breeding program",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "GB"
    },
    "priceRange": "££££",
    "paymentAccepted": "Cash, Bank Transfer",
    "currenciesAccepted": "GBP",
    "openingHours": "Mo-Su 09:00-18:00"
  })

  const getAnimalSchema = () => ({
    "@context": "https://schema.org",
    "@type": "AnimalShelter",
    "name": "Red Cat Cuasar British Shorthair Cattery",
    "url": "https://redcatcuasar.vercel.app",
    "description": "Specialized British Shorthair breeding program focusing on health, temperament, and breed standards",
    "animal": {
      "@type": "Animal",
      "species": "Cat",
      "breed": "British Shorthair"
    }
  })

  const getBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://redcatcuasar.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Cats",
        "item": "https://redcatcuasar.vercel.app/cats"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Contact",
        "item": "https://redcatcuasar.vercel.app/contact"
      }
    ]
  })

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return getOrganizationSchema()
      case 'petstore':
        return getPetStoreSchema()
      case 'animal':
        return getAnimalSchema()
      default:
        return getWebsiteSchema()
    }
  }

  return (
    <>
      <Script
        id={`structured-data-${type}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data || getSchema())
        }}
      />
      {type === 'website' && (
        <Script
          id="breadcrumb-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getBreadcrumbSchema())
          }}
        />
      )}
    </>
  )
}