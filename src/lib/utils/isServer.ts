/**
 * Utility function to check if code is running on the server or client
 * @returns boolean True if running on the server, false if running in the browser
 */
export function isServer(): boolean {
  return typeof window === "undefined"
}
