"use server";

import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import type { NextRequest } from "next/server";
import { validateServerSideSession } from "@/lib/middleware/sessionValidator";
import { authService } from "@/lib/server/authService";

// Create session cookie
export async function createSessionCookie(idToken: string) {
  try {
    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create the session cookie
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    // Set the cookie - with await for Next.js 15
    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return { success: false, error: "Failed to create session" };
  }
}

// Verify session cookie - Suveranitate digitală: folosește sistemul nostru liber
export async function verifySessionCookie(request?: NextRequest) {
  try {
    const cookieStore = await cookies();

    // If request is provided, try to get the cookie from the request
    const sessionCookie = request
      ? request.cookies.get("session")?.value
      : cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return { authenticated: false };
    }

    // Folosește validatorul suveran care evită restricțiile Firebase
    const sessionValidation = await validateServerSideSession(sessionCookie);

    if (!sessionValidation.valid) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      uid: sessionValidation.uid,
      admin: sessionValidation.isAdmin,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    return { authenticated: false };
  }
}

// Revoke session cookie - Suveranitate digitală: gestionare independentă
export async function revokeSessionCookie() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (sessionCookie) {
      // Verificăm sesiunea cu sistemul nostru suveran
      try {
        const sessionValidation = await validateServerSideSession(sessionCookie);
        if (sessionValidation.valid) {
          // Revoke all sessions for the user prin Firebase Admin
          await authService.revokeUserTokens(sessionValidation.uid);
        }
      } catch (error) {
        // If verification fails, just continue to delete the cookie
        console.error("Error verifying session during revocation:", error);
      }
    }

    // Delete the cookie - with await for Next.js 15
    cookieStore.delete("session");

    return { success: true };
  } catch (error) {
    console.error("Error revoking session:", error);
    // Still delete the cookie even if verification fails
    const cookieStore = await cookies();
    cookieStore.delete("session");
    return { success: true };
  }
}

// Add a function to get the current user information for API requests - Sistem suveran
export async function getCurrentUserForApi() {
  try {
    // We can't access localStorage on the server, so we need to use cookies or session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return { userId: null, userEmail: null };
    }

    // Folosește validatorul suveran pentru a obține informațiile utilizatorului
    const sessionValidation = await validateServerSideSession(sessionCookie);
    
    if (!sessionValidation.valid) {
      return { userId: null, userEmail: null };
    }

    // Obține detaliile complete ale utilizatorului
    const user = await authService.getUserById(sessionValidation.uid);

    return {
      userId: sessionValidation.uid || null,
      userEmail: user?.email || null,
    };
  } catch (error) {
    console.error("Error getting current user for API:", error);
    return { userId: null, userEmail: null };
  }
}