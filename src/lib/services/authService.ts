// Client-side service that uses API routes instead of direct Firebase access

interface User {
  uid: string
  email: string | null
  isAdmin: boolean
}

interface LoginResponse {
  success: boolean
  message?: string
  user?: User
}

interface SessionResponse {
  authenticated: boolean
  uid?: string
  email?: string
  isAdmin?: boolean
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          message: errorData.message || "Login failed",
        }
      }

      const data = await response.json()
      return {
        success: true,
        user: data.user,
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: "An unexpected error occurred",
      }
    }
  },

  async logout(): Promise<boolean> {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      return response.ok
    } catch (error) {
      console.error("Logout error:", error)
      return false
    }
  },

  async checkSession(): Promise<SessionResponse> {
    try {
      const response = await fetch("/api/auth/check-session")

      if (!response.ok) {
        return { authenticated: false }
      }

      const data = await response.json()
      return {
        authenticated: true,
        uid: data.uid,
        email: data.email,
        isAdmin: data.isAdmin,
      }
    } catch (error) {
      console.error("Session check error:", error)
      return { authenticated: false }
    }
  },
}
