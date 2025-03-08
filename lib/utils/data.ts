/**
 * Utility functions for data handling
 */

/**
 * Generate a random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Fetch data from an API endpoint
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch data")
  return res.json()
}

/**
 * Decode a base64 data URL to a Uint8Array
 */
export function decode(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binaryString = window.atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
} 