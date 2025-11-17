import React, { createContext, useEffect, useMemo, useState } from 'react'
import axiosClient from '../api/axiosClient'

type AuthContextShape = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (payload: RegisterPayload) => Promise<void>
}

type User = { id: string; email: string; name: string; role: string }

type RegisterPayload = {
  name: string
  email: string
  password: string
  dob: string
  phone?: string
  role?: string
}

export const AuthContext = createContext<AuthContextShape | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await axiosClient.get('/auth/user')
        setUser(res.data)
      } catch {
        localStorage.removeItem('access_token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const res = await axiosClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const token = res.data?.access_token
    if (token) {
      localStorage.setItem('access_token', token)
      const userRes = await axiosClient.get('/auth/user')
      setUser(userRes.data)
    }
  }

  const register = async (payload: RegisterPayload) => {
    const data: Record<string, string> = {
      ...payload,
      role: payload.role ?? 'CITIZEN',
      dob: new Date(payload.dob).toISOString().split('T')[0],
    }
    if (!payload.phone) {
      delete data.phone
    }
    await axiosClient.post('/auth/register', data)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      register,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
