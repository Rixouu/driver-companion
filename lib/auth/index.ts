/**
 * Authentication utilities
 * 
 * This directory contains authentication-related functionality.
 */

// Re-export auth utilities
export {
  getUserFromSession,
  isAdmin,
  isManager,
  canManageVehicles
} from './utils'

// Re-export auth configuration
export * from './config'

// Re-export from main auth file
export { auth, authOptions } from '../auth' 