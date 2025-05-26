// Settings types that were previously in lib/firebase/settingsService

export interface SeoSettings {
  metaTitle: string
  metaDescription: string
  ogImage: string
  googleAnalyticsId: string
}

export interface FirebaseSettings {
  maxImageSize: number
  maxVideoSize: number
}

export interface AllSettings {
  seo: SeoSettings
  firebase: FirebaseSettings
}

// Default values
export const defaultSeoSettings: SeoSettings = {
  metaTitle: "Red Cat Cuasar - Premium Maine Coon Cats",
  metaDescription: "Discover our beautiful Maine Coon cats and kittens. Premium quality, health guaranteed.",
  ogImage: "",
  googleAnalyticsId: "",
}

export const defaultFirebaseSettings: FirebaseSettings = {
  maxImageSize: 5,
  maxVideoSize: 50,
}

export const defaultSettings: AllSettings = {
  seo: defaultSeoSettings,
  firebase: defaultFirebaseSettings,
}
