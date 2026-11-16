import { User, UserPreferences } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Ensures HttpOnly cookies are attached and received
  })

  let json: any = null
  try {
    json = await response.json()
  } catch {
    json = { status: "error", message: "Invalid server response" }
  }

  if (!response.ok) {
    const errorMsg = json?.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return json
}

export const authApi = {
  async register(fullName: string, email: string, password: string): Promise<User> {
    const res = await apiFetch<{ status: string; data: { user: User } }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    })
    return res.data.user
  },

  async login(email: string, password: string): Promise<User> {
    const res = await apiFetch<{ status: string; data: { user: User } }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    return res.data.user
  },

  async logout(): Promise<void> {
    await apiFetch<{ status: string; message: string }>("/api/v1/auth/logout", {
      method: "POST",
    })
  },

  async refreshSession(): Promise<User> {
    const res = await apiFetch<{ status: string; data: { user: User } }>("/api/v1/auth/refresh", {
      method: "POST",
    })
    return res.data.user
  },

  async getMe(): Promise<User> {
    const res = await apiFetch<{ status: string; data: { user: User } }>("/api/v1/auth/me", {
      method: "GET",
    })
    return res.data.user
  },

  async updateProfile(updates: { fullName?: string; avatarUrl?: string }): Promise<User> {
    const res = await apiFetch<{ status: string; data: { user: User } }>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
    return res.data.user
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch<{ status: string; message: string }>("/api/v1/users/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },

  async getPreferences(): Promise<UserPreferences> {
    const res = await apiFetch<{ status: string; data: { preferences: UserPreferences } }>(
      "/api/v1/users/me/preferences",
      {
        method: "GET",
      }
    )
    return res.data.preferences
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await apiFetch<{ status: string; data: { preferences: UserPreferences } }>(
      "/api/v1/users/me/preferences",
      {
        method: "PATCH",
        body: JSON.stringify(preferences),
      }
    )
    return res.data.preferences
  },
}
