/**
 * Authentication service that uses API routes instead of Firebase directly
 */
type SessionResponse = {
  authenticated: boolean
  uid: string
  email: string | null
  isAdmin: boolean
  photoURL?: string | null
}

type LoginResponse = {
  success: boolean
  message?: string
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || "Login failed",
        }
      }

      return {
        success: true,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "An error occurred during login",
      }
    }
  },

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
  },

  /**
   * Check if the user is authenticated
   */
  async checkSession(): Promise<SessionResponse> {
    try {
      const response = await fetch("/api/auth/check-session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        return {
          authenticated: false,
          uid: "",
          email: null,
          isAdmin: false,
        }
      }

      const data = await response.json()

      return {
        authenticated: true,
        uid: data.uid,
        email: data.email,
        isAdmin: data.isAdmin,
        photoURL: data.photoURL,
      }
    } catch (error) {
      console.error("Error checking session:", error)
      return {
        authenticated: false,
        uid: "",
        email: null,
        isAdmin: false,
      }
    }
  },

  /**
   * Check if the user is an admin
   */
  async checkAdminStatus(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/check-admin", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.isAdmin === true
    } catch (error) {
      console.error("Error checking admin status:", error)
      return false
    }
  },

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || "Registration failed",
        }
      }

      return {
        success: true,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "An error occurred during registration",
      }
    }
  },
}
