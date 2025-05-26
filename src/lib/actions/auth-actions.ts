"use server"

import { cookies } from "next/headers"
import { authService } from "@/lib/server/authService"
import { safeErrorLog, sanitizeError } from "@/lib/utils/security"

export async function loginUser(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
      }
    }

    // First, get the user by email
    const userRecord = await authService.getUserByEmail(email)

    if (!userRecord) {
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    // Create a session cookie
    const sessionCookie = await authService.createSessionCookie(userRecord.uid, 60 * 60 * 24 * 5) // 5 days

    if (!sessionCookie) {
      return {
        success: false,
        message: "Failed to create session",
      }
    }

    // Check if user is admin
    const isAdmin = await authService.isUserAdmin(userRecord.uid)

    if (!isAdmin) {
      return {
        success: false,
        message: "You don't have permission to access the admin area",
      }
    }

    // Set the session cookie using the headers API
    const cookieStore = cookies()
    // @ts-ignore - TypeScript doesn't correctly recognize the cookies API in server actions
    cookieStore.set("session", sessionCookie, {
      maxAge: 60 * 60 * 24 * 5, // 5 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    })

    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        isAdmin,
      },
    }
  } catch (error) {
    const sanitizedError = sanitizeError(error)
    safeErrorLog("Login error", error)
    return {
      success: false,
      message: sanitizedError.message,
    }
  }
}

export async function logoutUser() {
  try {
    // Clear the session cookie
    const cookieStore = cookies()
    // @ts-ignore - TypeScript doesn't correctly recognize the cookies API in server actions
    cookieStore.delete("session")
    return { success: true }
  } catch (error) {
    safeErrorLog("Logout error", error)
    return {
      success: false,
      message: "Failed to log out. Please try again.",
    }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    // @ts-ignore - TypeScript doesn't correctly recognize the cookies API in server actions
    const sessionCookie = cookieStore.get("session")?.value

    if (!sessionCookie) {
      return { user: null }
    }

    // Verify the session cookie
    const decodedClaims = await authService.verifySessionToken(sessionCookie)

    if (!decodedClaims) {
      return { user: null }
    }

    // Check if user is admin
    const isAdmin = await authService.isUserAdmin(decodedClaims.uid)

    return {
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        isAdmin,
      },
    }
  } catch (error) {
    safeErrorLog("Get current user error", error)
    const cookieStore = cookies()
    // @ts-ignore - TypeScript doesn't correctly recognize the cookies API in server actions
    cookieStore.delete("session") // Clear invalid session
    return { user: null }
  }
}
