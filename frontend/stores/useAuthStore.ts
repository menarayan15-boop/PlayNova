import { create } from "zustand"
import { User, UserPreferences } from "@/types"
import { authApi } from "@/services/authApi"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

interface AuthActions {
  initAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<User>
  register: (fullName: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  updateProfile: (updates: { fullName?: string; avatarUrl?: string }) => Promise<User>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<UserPreferences>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initAuth: async () => {
    // Only initialize once on page boot
    if (get().isInitialized) return
    set({ isLoading: true, error: null })

    try {
      // 1. Try to fetch currently authenticated user from HttpOnly cookie
      const user = await authApi.getMe()
      set({ user, isAuthenticated: true, isInitialized: true, isLoading: false })
    } catch {
      // 2. If access token is expired, attempt session refresh
      try {
        const refreshedUser = await authApi.refreshSession()
        set({ user: refreshedUser, isAuthenticated: true, isInitialized: true, isLoading: false })
      } catch {
        // Unauthenticated session
        set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false })
      }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const user = await authApi.login(email, password)
      set({ user, isAuthenticated: true, isLoading: false, error: null })
      return user
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in"
      set({ error: message, isLoading: false, isAuthenticated: false })
      throw err
    }
  },

  register: async (fullName, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const user = await authApi.register(fullName, email, password)
      set({ user, isAuthenticated: true, isLoading: false, error: null })
      return user
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      set({ error: message, isLoading: false, isAuthenticated: false })
      throw err
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null })
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null })
    try {
      const updatedUser = await authApi.updateProfile(updates)
      set({ user: updatedUser, isLoading: false })
      return updatedUser
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null })
    try {
      await authApi.changePassword(currentPassword, newPassword)
      set({ isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change password"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  updatePreferences: async (prefUpdates) => {
    set({ isLoading: true, error: null })
    try {
      const updatedPrefs = await authApi.updatePreferences(prefUpdates)
      const currentUser = get().user
      if (currentUser) {
        set({
          user: { ...currentUser, preferences: updatedPrefs },
          isLoading: false,
        })
      }
      return updatedPrefs
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update preferences"
      set({ error: message, isLoading: false })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
